export const thirtyDaysFromNow = () => {
  const now = new Date();
  return now.setDate(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

export const fortyFiveMinutesFromNow = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 45);
  return now;
};
