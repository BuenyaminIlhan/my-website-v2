import { bootstrapApplication } from '@angular/platform-browser';
import { AppBrowserConfig } from './app/app.config.browser';
import { App } from './app/app';

bootstrapApplication(App, AppBrowserConfig)
  .catch((err) => console.error(err));
