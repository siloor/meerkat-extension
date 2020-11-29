interface WindowWithContainer extends Window {
  container: any;
}

const getContainer = () => {
  const windowWithContainer = window as Partial<WindowWithContainer>;

  if (!windowWithContainer.container) {
    windowWithContainer.container = {};
  }

  return windowWithContainer.container;
};

export const setToolbar = (toolbar) => {
  getContainer().toolbar = toolbar;
};

export const getToolbar = () => {
  return getContainer().toolbar;
};
