function button(text, callbackData, style = "primary") {
  return { text, callbackData, style };
}

function row(...buttons) {
  return buttons;
}

module.exports = { button, row };
