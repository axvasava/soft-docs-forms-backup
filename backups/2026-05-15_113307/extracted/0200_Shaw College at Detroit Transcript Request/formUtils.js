define([
  "./requiredIndicators.js",
  "./autoCompleteUtils.js",
  "./fieldStateUtils.js",
], function () {
  "use strict";

  console.log("formUtils 05-11-26 loaded");

  if (typeof window.createRequiredIndicators !== "function") {
    throw new Error("requiredIndicators.js did not load correctly.");
  }

  if (typeof window.createAutoCompleteUtils !== "function") {
    throw new Error("autoCompleteUtils.js did not load correctly.");
  }

  if (typeof window.createFieldStateUtils !== "function") {
    throw new Error("createFieldStateUtils.js did not load correctly.");
  }

  return {
    createRequiredIndicators: window.createRequiredIndicators,
    createFieldStateUtils: window.createFieldStateUtils,
    createAutoCompleteUtils: window.createAutoCompleteUtils,
  };
});
