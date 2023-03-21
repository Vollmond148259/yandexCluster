function setFragment(value) {
  if (value >= 0 && value <= 50) {
    return "0-50 м2";
  }
  if (value >= 50 && value <= 100) {
    return "50-100 м2";
  }
  if (value >= 100 && value <= 400) {
    return "100-400 м2";
  }
  if (value >= 400 && value <= 1000) {
    return "400-1000 м2";
  }
  if (value >= 1000 && value <= 3000) {
    return "1000-3000 м2";
  }
  if (value >= 3000 && value <= 10000) {
    return "3000-10000 м2";
  }
  if (value >= 10000 && value <= 20000) {
    return "10000-20000 м2";
  }
  if (value >= 20000 && value <= 40000) {
    return "20000-40000 м2";
  }
  if (value >= 40000 && value <= 60000) {
    return "40000-60000 м2";
  }
  if (value >= 40000 && value <= 60000) {
    return "40000-60000 м2";
  }
  if (value >= 60000 && value <= 100000) {
    return "60000-100000 м2";
  }
}
