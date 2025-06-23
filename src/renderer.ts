import { ProjectorApplication } from './classes/ProjectorApplication';
import { getExpressURLIfNeeded } from './functions/getExpressURLIfNeeded';
import './index.css';
import { getArgVFromQueryString } from './options';

let application: ProjectorApplication;

const init = async () => {
  const argv = getArgVFromQueryString();
  console.log(argv);
  if (window.VideoWallAPI) {
    await window.VideoWallAPI.startServer(argv);
  }
  try {
    const config = await (await fetch(getExpressURLIfNeeded(argv['config-json-path']))).json();
    application = new ProjectorApplication(config);
    await application.init();
  } catch (error) {
    console.error('Failed to fetch config JSON:', error);
    return;
  }
};

init();