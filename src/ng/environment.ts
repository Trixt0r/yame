import { BrowserWindow, App } from "electron";
import { Config } from "../common/interface/config";
import { YameEnvironment } from "common/interface/environment";

const env: YameEnvironment = {
  appDir: '',
  commonDir: '',
  ngDir: '',
  electronDir: '',
  config: { },
  plugins: []
};

export const Environment = env;
