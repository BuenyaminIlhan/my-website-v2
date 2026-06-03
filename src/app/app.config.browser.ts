import { mergeApplicationConfig, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { appConfig } from './app.config';

const browserConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};

export const AppBrowserConfig = mergeApplicationConfig(appConfig, browserConfig);
