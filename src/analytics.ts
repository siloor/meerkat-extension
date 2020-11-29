export const initAnalytics = () => {
  // Standard Google Universal Analytics code
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=(new Date()).getTime();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here

  window['ga']('create', 'UA-127764423-2', 'auto');
  window['ga']('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
  window['ga']('require', 'displayfeatures');
  window['ga']('send', 'pageview', '/background.html'); // Specify the virtual path
};

export const sendEvent = (category, action, label) => {
  window['ga']('send', 'event', category, action, label);
};
