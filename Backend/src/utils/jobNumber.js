export const buildJobNumber = ({ method, year, serial }) => {
  return `${method}-${year}-${String(serial).padStart(3, "0")}`;
};

export const buildRequestNumber = ({ year, serial }) => {
  return `PR-${year}-${String(serial).padStart(5, "0")}`;
};
