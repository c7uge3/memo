// Promise
function loadData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = { name: "John", age: 30 };
      resolve(data);
    }, 1000);
  });
}

loadData()
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

// async/await
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadData() {
  await delay(1000);
  const data = { name: "John", age: 30 };
  return data;
}

async function processData() {
  try {
    const data = await loadData();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

processData();
