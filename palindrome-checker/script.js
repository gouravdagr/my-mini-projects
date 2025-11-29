const textInput = document.getElementById("text-input");
const checkBtn = document.getElementById("check-btn");
const result = document.getElementById("result");
const toggleSwitch = document.getElementById('checkbox');

checkBtn.addEventListener("click", () => {
  const inputValue = textInput.value;
  if (!inputValue) {
    alert("Please input a value");
    return;
  };

  if (isPalindrome(inputValue)) {
    result.innerText = `${inputValue} is a palindrome`;
    textInput.value = "";
    result.style.color = "#2ecc71";
  } else {
    result.innerText = `${inputValue} is not a palindrome`;
    textInput.value = "";
    result.style.color = "#e74c3c";
  };
});

function isPalindrome(input) {
  const cleanInput = input.replace(/[^A-Za-z0-9]/gi, "").toLowerCase();
  const reversedInput = cleanInput.split("").reverse().join("");
  return cleanInput === reversedInput;
}

textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkBtn.click();
  }
});

toggleSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
});