import configparser

parser = configparser.ConfigParser()
parser.read("config.ini")

config = parser["config"]