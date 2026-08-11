/* jshint maxerr: 10000 */
(function () {
  "use strict";

  function createFieldStateUtils(root = document) {
    const READONLY_CLASS = "is-field-readonly";
    const DISABLED_CLASS = "is-field-disabled";
    const HELPER_CLASS = "field-helper-text";
    const REQUIRED_INDICATOR_CLASS = "required-indicator";

    console.log("fieldStateUtils 05-11-26 loaded");

    let vm = null;
    let initialized = false;
    let queue = [];
    let requiredIndicators = null;

    function getFieldById(id) {
      return root.getElementById
        ? root.getElementById(id)
        : document.getElementById(id);
    }

    function getHelperId(fieldId) {
      return `${fieldId}-field-helper`;
    }

    function supportsReadonly(field) {
      if (!field || !field.tagName) return false;

      const tag = field.tagName.toLowerCase();
      const type = (field.type || "").toLowerCase();

      if (tag === "textarea") return true;

      if (tag === "input") {
        return ![
          "checkbox",
          "radio",
          "button",
          "submit",
          "reset",
          "file",
          "range",
          "color",
        ].includes(type);
      }

      return false;
    }

    function addDescribedBy(field, helperId) {
      const current = field.getAttribute("aria-describedby") || "";
      const ids = current.split(/\s+/).filter(Boolean);

      if (!ids.includes(helperId)) {
        ids.push(helperId);
      }

      field.setAttribute("aria-describedby", ids.join(" "));
    }

    function isVisible(field) {
      return !!(
        field &&
        (field.offsetWidth ||
          field.offsetHeight ||
          field.getClientRects().length)
      );
    }

    function normalizeIdList(ids) {
      if (!Array.isArray(ids)) return [];
      return ids.filter(Boolean);
    }

    function shouldSkipField(field, options) {
      const except = normalizeIdList(options && options.except);
      const skipHidden = options && options.skipHidden === true;

      if (!field || !field.id) return true;
      if (except.includes(field.id)) return true;
      if (skipHidden && !isVisible(field)) return true;

      return false;
    }

    function lockField(fieldId, options) {
      const field = getFieldById(fieldId);
      if (shouldSkipField(field, options)) return;

      if (supportsReadonly(field)) {
        setFieldState(fieldId, {
          state: {
            readonly: true,
          },
          helperText:
            options &&
            Object.prototype.hasOwnProperty.call(options, "helperText")
              ? options.helperText
              : false,
        });
      } else {
        setFieldState(fieldId, {
          state: {
            disabled: true,
          },
          helperText: false,
        });
      }
    }

    function unlockField(fieldId, options) {
      const field = getFieldById(fieldId);
      if (shouldSkipField(field, options)) return;

      setFieldState(fieldId, {
        state: {
          readonly: false,
          disabled: false,
        },
        helperText: false,
      });
    }

    function lockFields(fieldIds, options) {
      normalizeIdList(fieldIds).forEach(function (fieldId) {
        lockField(fieldId, options || {});
      });
    }

    function unlockFields(fieldIds, options) {
      normalizeIdList(fieldIds).forEach(function (fieldId) {
        unlockField(fieldId, options || {});
      });
    }

    function getContainerFields(selectorOrElement) {
      const container =
        typeof selectorOrElement === "string"
          ? root.querySelector(selectorOrElement)
          : selectorOrElement;

      if (!container) return [];

      return Array.prototype.slice.call(
        container.querySelectorAll("input[id], select[id], textarea[id]"),
      );
    }

    function lockContainer(selectorOrElement, options) {
      getContainerFields(selectorOrElement).forEach(function (field) {
        lockField(field.id, options || {});
      });
    }

    function unlockContainer(selectorOrElement, options) {
      getContainerFields(selectorOrElement).forEach(function (field) {
        unlockField(field.id, options || {});
      });
    }

    function removeDescribedBy(field, helperId) {
      const current = field.getAttribute("aria-describedby") || "";
      const ids = current
        .split(/\s+/)
        .filter(Boolean)
        .filter(function (id) {
          return id !== helperId;
        });

      if (ids.length) {
        field.setAttribute("aria-describedby", ids.join(" "));
      } else {
        field.removeAttribute("aria-describedby");
      }
    }

    function setHelperText(field, helperText) {
      if (!field || !field.id) return;

      const helperId = getHelperId(field.id);
      let helper = getFieldById(helperId);

      if (!helperText) {
        if (helper) helper.remove();
        removeDescribedBy(field, helperId);
        return;
      }

      if (!helper) {
        helper = document.createElement("div");
        helper.id = helperId;
        helper.className = HELPER_CLASS;
        field.insertAdjacentElement("afterend", helper);
      }

      helper.textContent = helperText;
      addDescribedBy(field, helperId);
    }

    function clearRequired(fieldId) {
      if (
        requiredIndicators &&
        typeof requiredIndicators.setRequired === "function"
      ) {
        requiredIndicators.setRequired(fieldId, false);
      }
    }

    function applyFieldState(fieldId, options) {
      const field = getFieldById(fieldId);
      if (!field) return;

      const state = options.state || {};
      const helperText =
        options.helperText === false
          ? ""
          : typeof options.helperText === "string"
            ? options.helperText
            : "";

      if (state.hidden === true) {
        field.closest(".form-group, .row, div")?.classList.add("hidden");
        clearRequired(fieldId);
      }

      if (state.hidden === false) {
        field.closest(".form-group, .row, div")?.classList.remove("hidden");
      }

      if (state.disabled === true) {
        field.disabled = true;
        field.setAttribute("aria-disabled", "true");
        field.classList.add(DISABLED_CLASS);

        clearRequired(fieldId);
      }

      if (state.disabled === false) {
        field.disabled = false;
        field.removeAttribute("aria-disabled");
        field.classList.remove(DISABLED_CLASS);
      }

      if (state.readonly === true) {
        if (supportsReadonly(field)) {
          field.readOnly = true;
          field.setAttribute("readonly", "readonly");
          field.setAttribute("aria-readonly", "true");
        } else {
          field.disabled = true;
          field.setAttribute("aria-disabled", "true");
          clearRequired(fieldId);
        }

        field.classList.add(READONLY_CLASS);
      }

      if (state.readonly === false) {
        field.readOnly = false;
        field.removeAttribute("readonly");
        field.removeAttribute("aria-readonly");

        if (state.disabled !== true) {
          field.disabled = false;
          field.removeAttribute("aria-disabled");
        }

        field.classList.remove(READONLY_CLASS);
      }

      setHelperText(field, helperText);
    }

    function setFieldState(fieldId, options) {
      if (!fieldId) return;

      const normalizedOptions = options || {};

      if (!initialized) {
        queue.push({
          fieldId: fieldId,
          options: normalizedOptions,
        });
        return;
      }

      applyFieldState(fieldId, normalizedOptions);
    }

    function setReadOnly(fieldId, options) {
      setFieldState(fieldId, {
        state: {
          readonly: true,
        },
        helperText:
          options && Object.prototype.hasOwnProperty.call(options, "helperText")
            ? options.helperText
            : "Auto-filled",
      });
    }

    function setEditable(fieldId) {
      setFieldState(fieldId, {
        state: {
          readonly: false,
          disabled: false,
        },
        helperText: false,
      });
    }

    function setDisabled(fieldId, options) {
      setFieldState(fieldId, {
        state: {
          disabled: true,
        },
        helperText:
          options && Object.prototype.hasOwnProperty.call(options, "helperText")
            ? options.helperText
            : false,
      });
    }

    function setEnabled(fieldId) {
      setFieldState(fieldId, {
        state: {
          disabled: false,
        },
        helperText: false,
      });
    }

    function hideField(fieldId) {
      setFieldState(fieldId, {
        state: {
          hidden: true,
        },
        helperText: false,
      });
    }

    function showField(fieldId) {
      setFieldState(fieldId, {
        state: {
          hidden: false,
        },
      });
    }

    function lockFields(fieldIds, options) {
      if (!Array.isArray(fieldIds)) return;

      fieldIds.forEach(function (fieldId) {
        const field = getFieldById(fieldId);

        if (!field) return;

        if (supportsReadonly(field)) {
          setFieldState(fieldId, {
            state: {
              readonly: true,
            },
            helperText: false,
          });
        } else {
          setFieldState(fieldId, {
            state: {
              disabled: true,
            },
            helperText: false,
          });
        }
      });
    }

    function flushQueue() {
      if (!queue.length) return;

      queue.forEach(function (item) {
        applyFieldState(item.fieldId, item.options);
      });

      queue = [];
    }

    function setExportMode(isEnabled) {
      const enabled = Boolean(isEnabled);

      document.body.classList.toggle("is-export-mode", enabled);

      root
        .querySelectorAll(`.${REQUIRED_INDICATOR_CLASS}`)
        .forEach(function (indicator) {
          indicator.style.display = enabled ? "none" : "";
        });

      root.querySelectorAll(".required-note").forEach(function (note) {
        note.style.display = enabled ? "none" : "";
      });

      root.querySelectorAll(`.${HELPER_CLASS}`).forEach(function (helper) {
        helper.style.display = enabled ? "none" : "";
      });
    }

    function init(viewModel, options) {
      vm = viewModel;
      requiredIndicators =
        options && options.requiredIndicators
          ? options.requiredIndicators
          : null;

      initialized = true;
      flushQueue();

      return api;
    }

    const api = {
      init: init,

      setFieldState: setFieldState,

      setReadOnly: setReadOnly,
      setEditable: setEditable,
      setDisabled: setDisabled,
      setEnabled: setEnabled,
      hideField: hideField,
      showField: showField,
      lockFields: lockFields,

      setExportMode: setExportMode,

      // Backward-compatible aliases.
      makeReadOnly: setReadOnly,
      makeEditable: setEditable,
    };

    return api;
  }

  window.createFieldStateUtils = createFieldStateUtils;

  // Temporary backward compatibility.
  window.createAutoCompleteUtils = createFieldStateUtils;
})();
