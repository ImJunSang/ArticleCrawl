import axios from 'axios';
import { setStorageItem, getStorageItem } from './storage';

import '../styles/sidepanel.scss';

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

document.getElementById('start-button').addEventListener('click', () => start());

const URL_ENDPOINT = 'http://localhost:8000/api/article/url_to_update';
const UPDATE_ENDPOINT = 'http://localhost:8000/api/article/update';

async function start() {
  const response = await axios.get(URL_ENDPOINT);
  const id = response.data.id;
  const nextURL = response.data.url;

  await setStorageItem('keywords', response.data.keywords);
  await setStorageItem('nextId', id);
  const tab = await chrome.tabs.create({ url: nextURL });

  await sleep(2000);
  callUpdate(tab.id);
}

async function callUpdate(tabId: number, prevURL = '') {
  await sleep(200);

  let curentTab = await chrome.tabs.get(tabId);
  let currentURL = curentTab.url;

  let wait = 0;

  while (currentURL === prevURL) {
    await sleep(200);

    console.log('wait...');

    curentTab = await chrome.tabs.get(tabId);
    currentURL = curentTab.url;

    wait += 1;
    if (wait === 500) {
      const nextURL = await errorHandler(tabId, 'Page timeout');
      addUpdated(currentURL, 'Page timeout');
      await chrome.tabs.update(null, { url: nextURL });
      callUpdate(tabId, currentURL);

      return true;
    }
  }

  if (currentURL.includes('err=404')) {
    const nextURL = await errorHandler(tabId, 'Page not found');
    addUpdated(currentURL, 'Page not found');
    await chrome.tabs.update(null, { url: nextURL });
    callUpdate(tabId, currentURL);

    return true;
  }

  try {
    const response: { error: string; nextURL: string } = await chrome.tabs.sendMessage(tabId, { update: true });
    if (response.error === 'robot detector') {
      return true;
    }
    addUpdated(currentURL, response.error);
    await chrome.tabs.update(null, { url: response.nextURL });
    callUpdate(tabId, currentURL);
  } catch (e) {
    const nextURL = await tabErrorHandler(tabId);
    if (nextURL) {
      addUpdated(currentURL, 'Page load failed');
      await chrome.tabs.update(null, { url: nextURL });
    } else {
      console.log('content script error. retry...');
    }
    callUpdate(tabId, prevURL);
  }

  return true;
}

function addUpdated(url: string, error: string) {
  if (error) {
    console.log('fail', error);
  } else {
    console.log('success');
  }

  const doneList = document.getElementById('done-list');
  const li = document.createElement('li');
  li.classList.add('font-size-10');
  if (error) {
    li.classList.add('text-danger');
    const errorCount = document.getElementById('error-count');
    errorCount.textContent = (parseInt(errorCount.textContent) + 1).toString();
  } else {
    li.classList.add('text-success');
    const successCount = document.getElementById('success-count');
    successCount.textContent = (parseInt(successCount.textContent) + 1).toString();
  }
  li.textContent = error ? `${url} - ${error}` : url;
  doneList.appendChild(li);

  const totalCount = document.getElementById('total-count');
  totalCount.textContent = (parseInt(totalCount.textContent) + 1).toString();
}

async function tabErrorHandler(tabId: number) {
  const frame = await chrome.webNavigation.getFrame({ tabId: tabId, frameId: 0 });
  if (!frame.errorOccurred) {
    return false;
  }
  return await errorHandler(tabId, 'Page load failed');
}

async function errorHandler(tabId: number, error: string) {
  const nextId = await getStorageItem('nextId');
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body: { id: string; text: string[]; error: string } = {
    id: nextId,
    text: [],
    error: error,
  };
  const response = await axios.post(UPDATE_ENDPOINT, body, config);
  const id = response.data.id;
  await setStorageItem('nextId', id);

  return response.data.url;
}
