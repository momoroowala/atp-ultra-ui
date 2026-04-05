interface Window {
  Vidalytics?: any;
  VidalyticsLoader?: any;
  getVidalyticsPlayer?: (embedId: string) => Promise<any>;
}
