declare global {
  const __buildEnv__: string;
  const __buildVersion__: string;
}

export default {
  buildEnv: __buildEnv__,
  buildVersion: __buildVersion__
};
