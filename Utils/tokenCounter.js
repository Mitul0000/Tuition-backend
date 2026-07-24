exports.countTokens = (text) => {
  if(!text ) return 0;
  const estimatedTokens = Math.ceil(text.length / 4);
  return estimatedTokens;
}