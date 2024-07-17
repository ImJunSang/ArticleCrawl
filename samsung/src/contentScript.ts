import axios from 'axios';
import { setStorageItem, getStorageItem } from './storage';

const UPDATE_ENDPOINT = 'http://localhost:8000/api/article/update';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.update === true) {
    updateHandler(sendResponse);
  }
  return true;
});

// eslint-disable-next-line
const updateHandler = async (sendResponse: (response: any) => void) => {
  const response = await update();
  sendResponse(response);
};

async function update() {
  if (robotChecker()) {
    return { error: 'robot detector', nextURL: '' };
  }

  const nextId = await getStorageItem('nextId');
  const keywords = await getStorageItem('keywords');
  let text: string[] = [];
  let error = '';
  try {
    text = searchSamsungParagraphs(keywords);
  } catch (e) {
    text = [];
    error = 'HTML parsing error';
  }
  if (text.length === 0) {
    error = `No keyword found`;
  }
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body = {
    id: nextId,
    text: text,
    error: error,
  };
  const response = await axios.post(UPDATE_ENDPOINT, body, config);
  const id = response.data.id;
  await setStorageItem('nextId', id);

  return { error, nextURL: response.data.url };
}

function searchSamsungParagraphs(keywords: string[]): string[] {
  const body = document.querySelector('body');
  const elems = body.querySelectorAll(':not(script):not(style)');
  const results: string[] = [];
  elems.forEach((elem) => {
    if (!(elem instanceof HTMLElement)) return;
    keywords.forEach((keyword) => {
      if (elem.tagName === 'a') return;
      if (elem.innerText === keyword) return;
      if (elem.innerText.includes(keyword)) {
        for (const found of results) {
          if (elem.innerText.includes(found)) {
            return;
          }
        }
        let replaced = false;
        results.forEach((result, i) => {
          if (result.includes(elem.innerText)) {
            results[i] = elem.innerText;
            replaced = true;
          }
        });
        if (!replaced) {
          results.push(elem.innerText);
        }
      }
    });
  });
  return results;
}

function robotChecker() {
  const checker = document.querySelector('#captcha-container > div.captcha__human > div > p.captcha__human__title');
  if (checker) {
    return true;
  }
  return false;
}
