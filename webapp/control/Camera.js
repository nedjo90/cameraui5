sap.ui.define(["sap/ui/core/Control"], (Control) => {
  "use strict";

  return Control.extend("soprasteriacamera.control.camera", {
    metadata: {
      type: "object",
      library: "",
      properties: {
        id: { type: "string", required: true },
      },
      defaultProperty: "",
      agregation: {},
      defaultAggregation: "",
      associations: {},
      events: {},
    },

    init: function (oControl) {
      if (Control.prototype.init) {
        Control.prototype.init.apply(this, arguments);
        const style = document.createElement("style");
        style.innerHTML = this._cameraStyle();
        document.head.appendChild(style);
        document.addEventListener(
          "fullscreenchange",
          this._fullscreenChange.bind(this)
        );
        this._visibleOnActionLayer = [];
        this._visibleOnCustomizingLayer = [];
        this._canvas = this._createHtmlElementTreeFromJson(
          this._getCameraCanvasObject()
        );
        this._image = null;
        this._actionLayer = this._createHtmlElementTreeFromJson(
          this._getCameraActionLayerObject()
        );
        this._videoLayer = this._createHtmlElementTreeFromJson(
          this._getCameraVideosObject()
        );
        this._toggleVisibilityIconOnlyCustomizingLayer();
        console.log(
          "this._visibleOnActionLayer :>> ",
          this._visibleOnActionLayer
        );
        console.log(
          "this._visibleOnCustomizingLayer :>> ",
          this._visibleOnCustomizingLayer
        );
        this._track = null;
        console.log("navigator.userAgent :>> ", navigator.userAgent);
      }
    },
    exit: function () {
      if (Control.prototype.exit) {
        Control.prototype.exit.apply(this, arguments);
      }
    },
    onBeforeRendering: function () {},
    onAfterRendering: function () {
      this._cameraContainer = document.getElementById(this.sId);
    },
    renderer: function (oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.class("cameraRootNode cameraRootNodeVisible");
      oRm.openEnd("div");
      oRm.close("div");
    },
    async openCamera() {
      console.clear();
      console.log("openCamera method start");
      if (this._cameraContainer) {
        console.log("Before Creating HTML Elments");
        console.log(
          "this._cameraContainer :>> ",
          this._cameraContainer.cloneNode(true)
        );
        console.log("this._actionLayer :>> ", this._actionLayer);
        await this._startVideo();
        this._cameraContainer.appendChild(this._canvas);
        this._cameraContainer.appendChild(this._videoLayer);
        this._cameraContainer.appendChild(this._actionLayer);
        console.log("After Creating HTML Elments");
        console.log(
          "this._cameraContainer :>> ",
          this._cameraContainer.cloneNode(true)
        );
      } else {
        console.error("Fail to get the camera container HTML Element");
      }
      this._cameraContainer.requestFullscreen();
    },

    async _closeCamera(
      exitFullscreen = false,
      removeActionLayer = false,
      removeCanvas = false,
      removeVideoLayer = false
    ) {
      this._image = null;
      this._canvas
        .getContext("2d")
        .clearRect(0, 0, this._canvas.width, this._canvas.height);
      if (removeCanvas && this._cameraContainer.contains(this._canvas)) {
        this._cameraContainer.removeChild(this._canvas);
      }
      if (
        removeActionLayer &&
        this._cameraContainer.contains(this._actionLayer)
      )
        this._cameraContainer.removeChild(this._actionLayer);
      if (
        removeVideoLayer &&
        this._cameraContainer.contains(this._videoLayer)
      ) {
        this._cameraContainer.removeChild(this._videoLayer);
      }
      if (removeVideoLayer) {
        await this._track.stop();
        this._videoLayer.srcObject = null;
      }
      if (exitFullscreen) document.exitFullscreen();
    },

    _fullscreenChange(oEvent) {
      if (!document.fullscreenElement) {
        this._closeCamera(false, true, true, true);
      }
    },
    _onPressCloseActionLayerIcon(oEvent) {
      console.log("Close Icon Button Pressed");
      this._closeCamera(true, true, true, true);
    },
    _onPressCloseCustomizingLayerIcon(oEvent) {
      console.log("Close Icon Button Pressed");
      this._closeCamera(false, true, true, true);
    },
    _onPressSettingsIcon(oEvent) {
      console.log("Settings Icon Button Pressed");
    },
    _onPressCancelIcon() {
      console.log("press cancel icon");
    },
    async _onPressTriggerIcon(oEvent) {
      console.log("Trigger Icon Button Pressed");

      const actionLayer = this._actionLayer;

      if (!actionLayer.classList.contains("flashSimulation")) {
        actionLayer.classList.add("flashSimulation");
      }

      actionLayer.classList.remove("invisible");
      actionLayer.classList.add("visible");

      await this._takePictureInCanvas();

      const transitionDuration = 200;
      setTimeout(() => {
        actionLayer.classList.remove("visible");
        actionLayer.classList.add("invisible");
      }, transitionDuration);

      try {
        await this._takePictureInCanvas();
        this._canvas.style.zIndex = 2;
        this._toggleVisibilityIconOnlyActionLayer();
        this._toggleVisibilityIconOnlyCustomizingLayer();
      } catch (error) {
        console.error("Erreur dans le canvas", error);
      }
    },
    _toggleVisibilityIconOnlyActionLayer() {
      this._visibleOnActionLayer.forEach((element) => {
        element.classList.toggle("hiddenIconOnlyActionLayer");
        console.log("element :>> ", element);
      });
    },
    _toggleVisibilityIconOnlyCustomizingLayer() {
      this._visibleOnCustomizingLayer.forEach((element) => {
        element.classList.toggle("hiddenIconOnlyCustomizingLayer");
        console.log("element :>> ", element);
      });
    },
    async _takePictureInCanvas() {
      this._canvas.width = this._videoLayer.videoWidth;
      this._canvas.height = this._videoLayer.videoHeight;
      // this._canvas.getContext("2d").drawImage(this._videoLayer, 0, 0);
      return await new Promise((resolve, reject) => {
        if (!this._canvas || !this._videoLayer) {
          return reject(new Error("Canvas ou vidéo non définis"));
        }

        requestAnimationFrame(() => {
          try {
            this._canvas.getContext("2d").drawImage(this._videoLayer, 0, 0);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    },
    async _startVideo() {
      await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 4096 },
            height: { ideal: 2160 },
          },
          audio: false,
        })
        .then((stream) => {
          this._track = stream.getTracks()[0];
          this._videoLayer.srcObject = stream;
          console.log("Dans .then() - track :>> ", this.track);
        })
        .catch((error) => {
          console.error("Oops. Something is broken.", error);
        });
    },
    _createHtmlElementTreeFromJson(element) {
      if (!element || typeof element !== "object" || !element.type) {
        console.error(
          "Erreur : L'élément est mal formé ou manque de 'type'.",
          element
        );
        return null;
      }
      const domElement = document.createElement(element.type);
      if (element.innerHTML) {
        domElement.innerHTML = element.innerHTML;
      }
      this._addEvents(domElement, element.events);
      this._addAttributes(domElement, element.attributes);
      if (Array.isArray(element.children)) {
        for (let i = 0; i < element.children.length; i++) {
          const child = this._createHtmlElementTreeFromJson(
            element.children[i]
          );
          if (child) {
            domElement.appendChild(child);
          }
        }
      }
      return domElement;
    },
    _addEvents(domElement, events) {
      if (events) {
        for (const [eventType, functionName] of Object.entries(events)) {
          if (typeof this[functionName] === "function") {
            domElement.addEventListener(
              eventType,
              this[functionName].bind(this)
            );
          } else {
            console.warn(`Fonction ${functionName} non définie dans la classe`);
          }
        }
      }
    },
    _addAttributes(domElement, attributes) {
      console.log("attributes :>> ", attributes);
      if (attributes && typeof attributes === "object") {
        for (const [key, value] of Object.entries(attributes)) {
          if (typeof value === "string" && typeof key === "string") {
            domElement.setAttribute(key, value);
            if (key === "class" && value.includes("iconOnlyActionLayer")) {
              this._visibleOnActionLayer.push(domElement);
            } else if (
              key === "class" &&
              value.includes("iconOnlyCustomizingLayer")
            ) {
              this._visibleOnCustomizingLayer.push(domElement);
            }
          } else if (value === null || value === undefined) {
            console.warn(
              `Avertissement : L'attribut '${key}' a une valeur invalide (null ou undefined).`
            );
          }
        }
      } else {
        console.warn("Avertissement : Aucun attribut valide fourni.");
      }
    },
    _destroyHtmlElementTree(element) {
      if (!element) return;
      for (let child of element.children) {
        this._destroyHtmlElementTree(child);
      }
      element.remove();
      element = null;
    },
    _cameraStyle() {
      return `
      `;
    },
    _getCameraActionLayerObject() {
      return {
        type: "div",
        attributes: {
          id: "CameraActionLayer",
          class: "cameraActionLayer invisible",
        },
        children: [
          {
            type: "div",
            attributes: {
              id: "CameraActionLayerTop",
              class: "cameraActionLayerTop",
            },
            children: [
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerTopLeft",
                  class: "cameraActionLayerTopLeft",
                },
                children: [
                  {
                    type: "span",
                    innerHTML: "\ue1bb",
                    attributes: {
                      id: "CameraCloseIcon",
                      class: "cameraIcon cameraCloseIcon",
                    },
                    events: {
                      click: "_onPressCloseActionLayerIcon",
                    },
                    children: [],
                  },
                ],
              },
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerTopCenter",
                  class: "cameraActionLayerTopCenter",
                },
                children: [],
              },
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerTopRight",
                  class: "cameraActionLayerTopRight",
                },
                children: [
                  {
                    type: "span",
                    innerHTML: "\ue0a6",
                    attributes: {
                      id: "CameraSettingsIcon",
                      class:
                        "cameraIcon cameraSettingsIcon iconOnlyActionLayer hiddenIconOnlyActionLayer",
                    },
                    events: {
                      click: "_onPressSettingsIcon",
                    },
                    children: [],
                  },
                  {
                    type: "span",
                    innerHTML: "\ue03e",
                    attributes: {
                      id: "CameraCancelIcon",
                      class:
                        "cameraIcon cameraCancelIcon iconOnlyCustomizingLayer hiddenIconOnlyCustomizingLayer",
                    },
                    events: {
                      click: "_onPressCancelIcon",
                    },
                    children: [],
                  },
                  {
                    type: "span",
                    innerHTML: "\ue0c1",
                    attributes: {
                      id: "CameraPenIcon",
                      class:
                        "cameraIcon cameraPenIcon iconOnlyCustomizingLayer hiddenIconOnlyCustomizingLayer",
                    },
                    events: {
                      click: "_onPressPenIcon",
                    },
                    children: [],
                  },
                  {
                    type: "span",
                    innerHTML: "\ue145",
                    attributes: {
                      id: "CameraPenIcon",
                      class:
                        "cameraIcon cameraPenIcon iconOnlyCustomizingLayer hiddenIconOnlyCustomizingLayer",
                    },
                    events: {
                      click: "_onPressPenIcon",
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            type: "div",
            attributes: {
              id: "CameraActionLayerBottom",
              class: "cameraActionLayerBottom",
            },
            children: [
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerBottomLeft",
                  class: "cameraActionLayerBottomLeft",
                },
                children: [],
              },
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerBottomCenter",
                  class: "cameraActionLayerBottomCenter",
                },
                children: [
                  {
                    type: "span",
                    innerHTML: "\ue11c",
                    attributes: {
                      id: "CameraTriggerIcon",
                      class:
                        "cameraIcon cameraTriggerIcon iconOnlyActionLayer hiddenIconOnlyActionLayer",
                    },
                    events: {
                      click: "_onPressTriggerIcon",
                    },
                    children: [],
                  },
                ],
              },
              {
                type: "div",
                attributes: {
                  id: "CameraActionLayerBottomRight",
                  class: "cameraActionLayerBottomRight",
                },
                children: [
                  {
                    type: "span",
                    innerHTML: "\ue00a",
                    attributes: {
                      id: "CameraSwitchEnvironmentIcon",
                      class:
                        "cameraIcon CameraSwitchEnvironmentIcon iconOnlyActionLayer hiddenIconOnlyActionLayer",
                    },
                    events: {},
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };
    },
    _getCameraCanvasObject() {
      return {
        type: "canvas",
        attributes: {
          id: "CameraCanvas",
          class: "cameraCanvas",
        },
        children: [],
      };
    },
    _getCameraVideosObject() {
      return {
        type: "video",
        attributes: {
          id: "CameraVideoLayer",
          class: "cameraVideoLayer",
          autoplay: "true",
          playsInline: "true",
        },
        children: [],
      };
    },
  });
});
