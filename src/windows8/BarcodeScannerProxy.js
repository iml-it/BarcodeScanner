/*
 * Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
cordova.define("com.phonegap.plugins.barcodescanner.BarcodeScannerProxy", function (require, exports, module) {
  module.exports = {

    /**
     * Scans image via device camera and retieves barcode from it.
     * @param  {function} success Success callback
     * @param  {function} fail    Error callback
     * @param  {array} args       Arguments array
     */
    scan: function (success, fail, args) {

      var capturePreview = null,
          capture = null,
          bgElement = null,
          wrapper = null,
          captureSettings = null,
          reader = null,
          orientationSensor = null,

          /* Width of bitmap, generated from capture stream and used for barcode search */
          bitmapWidth = 800,
          /* Width of bitmap, generated from capture stream and used for barcode search */
          bitmapHeight = 600;

      /**
       * Creates a preview frame and necessary objects
       */
      function createPreview() {

        // Create fullscreen preview
        wrapper = document.createElement("div");
        bgElement = document.createElement("div");
        capturePreview = document.createElement("video");
        wrapper.style.cssText = "position: absolute; top: 50%; left: 50%; height: 400px; width: 400px; margin-left: -200px; margin-top: -200px; overflow: hidden; z-index: 100";
        bgElement.style.cssText = "position: absolute; top: 0; left: 0; height: 100%; width: 100%; background-color: grey; opacity: 0.9; z-index: 99";
        bgElement.addEventListener('click', cancelPreview, false);
        capturePreview.style.cssText = "width: 350%; margin-left: -125%; margin-top: -50%";
        capture = new Windows.Media.Capture.MediaCapture();

        captureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
        captureSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;
        captureSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;

        orientationSensor = Windows.Devices.Sensors.SimpleOrientationSensor.getDefault();
      }

      /**
       * Starts stream transmission to preview frame and then run barcode search
       */
      function startPreview() {
        capture.initializeAsync(captureSettings).done(function () {
          var orientation = orientationSensor.getCurrentOrientation();
          switch (orientation) {
          case Windows.Devices.Sensors.SimpleOrientation.notRotated:
            capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.none);
            break;
          case Windows.Devices.Sensors.SimpleOrientation.rotated90DegreesCounterclockwise:
            capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise270Degrees);
            break;
          case Windows.Devices.Sensors.SimpleOrientation.rotated180DegreesCounterclockwise:
            capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise180Degrees);
            break;
          case Windows.Devices.Sensors.SimpleOrientation.rotated270DegreesCounterclockwise:
            capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise90Degrees);
            break;
          default:
            capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.none);
            break;
          }

          capturePreview.src = URL.createObjectURL(capture);
          capturePreview.play();

          // Insert preview frame and controls into page
          wrapper.appendChild(capturePreview);
          document.body.appendChild(bgElement);
          document.body.appendChild(wrapper);

          startBarcodeSearch();
        });
      }

      /**
       * Starts barcode search process, implemented in WinRTBarcodeReader.winmd library
       * Calls success callback, when barcode found.
       */
      function startBarcodeSearch() {
        reader = new WinRTBarcodeReader.Reader(capture, bitmapWidth, bitmapHeight);
        readOp = reader.readCode();
        readOp.done(function (result) {
          destroyPreview();
          if (result) {
            success({ text: result.text, format: result.barcodeFormat, cancelled: false });

          } else {
            success({ text: null, format: null, cancelled: true });
          }
        });
      }

      /**
       * Removes preview frame and corresponding objects from window
       */
      function destroyPreview() {
        capturePreview.pause();
        capturePreview.src = null;
        [wrapper, bgElement].forEach(function (elem) {
          if (elem /* && elem in document.body.childNodes */) {
            document.body.removeChild(elem);
          }
        });
        if (reader) {
          reader = null;
        }
        if (capture) {
          capture.stopRecordAsync();
          capture = null;
        }
      }

      /**
       * Stops preview and then call success callback with cancelled=true
       * See https://github.com/phonegap-build/BarcodeScanner#using-the-plugin
       */
      function cancelPreview() {
        reader.stop();
      }

      try {
        createPreview();
        startPreview();
      } catch (ex) {
        fail(ex);
      }
    },

    /**
     * Encodes specified data into barcode
     * @param  {function} success Success callback
     * @param  {function} fail    Error callback
     * @param  {array} args       Arguments array
     */
    encode: function (success, fail, args) {
      fail("Not implemented yet");
    }
  };
  require("cordova/windows8/commandProxy").add("BarcodeScanner", module.exports);

});
