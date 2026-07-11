//כלים קטנים למוק, למשל wait, כדי לדמות API אמיתי עם loading.



export function wait(ms = 350) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function cloneData(data) {
  return structuredClone(data);
}