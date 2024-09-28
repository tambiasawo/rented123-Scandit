import {
  Camera,
  CameraSettings,
  Translations as CoreTranslations,
  CameraSwitchControl,
  DataCaptureContext,
  DataCaptureView,
  FrameSourceState,
  Localization,
  configure,
} from 'scandit-web-datacapture-core';
import type {
  CapturedId,
  IdCaptureError,
  IdCaptureSession,
  Translations as IdTranslations,
  AamvaBarcodeVerificationResult,
  AamvaVizBarcodeComparisonResult,
  VizMrzComparisonResult,
} from 'scandit-web-datacapture-id'; // typescript types
import {
  IdCapture,
  IdCaptureErrorCode,
  IdCaptureOverlay,
  IdCaptureSettings,
  IdDocumentType,
  IdImageType,
  SupportedSides,
  idCaptureLoader,
  AamvaBarcodeVerifier,
  AamvaVizBarcodeComparisonVerifier,
  VizMrzComparisonVerifier,
} from 'scandit-web-datacapture-id';
import * as UI from './ui';

const LICENSE_KEY =
  'AeZ0oGWSQmmLDSv+ARSMTM9FLzaOEj7b02ostVsT6bmWaHotgHoNV61Ct8C5PCc+v3lF9b1DI7tlTn8wDUefs/EOgpGuLznxckSbCUJcCMZGHJYMazZLKXUA5R8FfKTxrVwr3sF9bIbXckH8o3COIWl4cN7aVOzd9W104RZxH1UxZhSQ2U8BTVJlRndJWtfi3kIk8flekC8sYuD/2Vx71odhgKeQeMOcrX1C7WFRwTKpcvp7FXgK/pZ299zoQ2jPyANdDnh7F84Sanr7s3v5pjtCnz+tczgq31HUqkFv6zBoSYs1kioE3kZYX2MSEIfe/mR1+ZdVKXQVVafHH2X/6S1KhTEgAbSaKkoIaIx+z092epy6njMOhykv+SqEfHg9LROqqlgkWFC/VLJKoUFLl694cqCABHSoYllV88EB2acDfxNuvRgoG2I3YJeNd8DA4DmtRt5nYux1YFVF7XlPCkZhMxgOVdo9SEYIxgpW1pdjQJHl3jgPe21AHg7HZuYA9CTuUngveuUDMwrD40CZhRcWTTfdRrCLRU1fQLkbwqPKTc9H31L/HKxEOKSEX6FcukQPckhCgP6tfZQDXQOgzR5jvmwSawNYknSn9Y9vzH6UXAaCElF6tuoR0vkIEcd55BV+j3oUB1kjYQzYgFjf9fRUPwQViBdKY54DTRTH78KzqJCOfMpwdVpRhEVinofO8HHGoFaABVE/fDcl502zlqq24U8mKOB7vbl5VNZxbNSPVzgXCxiC9UADEn8nMB95WFfdy7UUY6ufCzFgEaiQAeO3ZLzsZFu1UQQJHi1X2O9fChdIzQPU+VzpysjP8Xc+dxxbEiwDjR4RDFSK3DaQ61Q0rx0hJXJhIyvyfEgRSHagn2fU4huDJ4yC5duW6UcnxAHWE+Ob3r5stBy/BE8YxXvquaucxDfkmi3awPeMBoCTyioA21pFdi4dD0144Wg4X93KWDgQW4UGd7z9TO+yIk9ORB7TkKAmTaU3r0jBJ0RgfnTxtX4TqSFlG4LzjGYeIEDOQkKxc5Y/CZBt6Rzo9W7V+TLp1l1pEfjevvKoqaSIqDcaRRfMNPBMB5UxhCC44vmdgpB19u+l5txA3kTKqgcs+L/IEzKtbVa5wAcRUkpj9wsK0L/J3777QkEoXmCRyoFvp7OfGhZ9XOOd7jK4SVnUJpwrjvEVh61fJkVrNoNg46qr6NC3Pv3FDEXf58kOwBVQyTUv7HBWWj1xJoK7PNL59lea4tvX9POl975Ek++zczY9nYQGFEKMpae5IqL/mjKB/Q7dxHQ7bYjaoPZyD5+SSm1A9jWZb8/Gn3S5Sig/2ZnHy6VPoBf8b+BSk7/cV7vNkg=='; // will auto consider from env due to vite config setup

type Mode = 'viz';

let context: DataCaptureContext;
let idCapture: IdCapture;
let view: DataCaptureView;
let overlay: IdCaptureOverlay;
let camera: Camera;
let currentMode: Mode;

export interface VerificationResult {
  // vizMrzComparisonResult: VizMrzComparisonResult | null; UNCOMMENT ONCE UPGRADE IS AVAILABLE OTHERWISE VERIFICATION WILL NOT WORK FOR OTHER DOCUMENTS AS WELL. tHIS WAS ADDED FOR PASSPORT VERIFICATION
  aamvaVizBarcodeComparisonResult: AamvaVizBarcodeComparisonResult | null;
  aamvaBarcodeVerificationResult: AamvaBarcodeVerificationResult | null;
}

// Here is how to update some translations
Localization.getInstance().update<IdTranslations | CoreTranslations>({
  'core.view.loading': 'Loading ID Capture...',
  // "id.idCaptureOverlay.scanFrontSideHint": "Custom text for front of document",
  // "id.idCaptureOverlay.scanBackSideHint": "Custom text for back of document",
});

// A map defining which document types we enable depending on the selected mode.
const supportedDocumentsByMode: { [key in Mode]: IdDocumentType[] } = {
  // mrz: [
  //   IdDocumentType.VisaMRZ,
  //   IdDocumentType.PassportMRZ,
  //   IdDocumentType.SwissDLMRZ,
  //   IdDocumentType.IdCardMRZ,
  // ],
  viz: [
    IdDocumentType.DLVIZ,
    IdDocumentType.IdCardVIZ,
    IdDocumentType.PassportVIZ,
    //IdDocumentType.AAMVABarcode,
  ],
};

function createIdCaptureSettingsFor(mode: Mode): IdCaptureSettings {
  const settings = new IdCaptureSettings();
  settings.supportedDocuments = supportedDocumentsByMode[mode];
  // For VIZ documents, we enable scanning both sides and want to get the ID image
  if (mode === 'viz') {
    settings.supportedSides = SupportedSides.FrontAndBack;
    settings.setShouldPassImageTypeToResult(IdImageType.Face, true);
  }

  return settings;
}

// Apply the newly selected mode.
// eslint-disable-next-line sonarjs/cognitive-complexity
async function createIdCapture(settings: IdCaptureSettings): Promise<void> {
  idCapture = await IdCapture.forContext(context, settings);

  // Create an instance of the verifier, to be used later when a document has been scanned
  const mrzComparisonVerifier = VizMrzComparisonVerifier.create();
  const comparisonVerifier = AamvaVizBarcodeComparisonVerifier.create();
  const barcodeVerifier = await AamvaBarcodeVerifier.create(context);

  async function verifyScannedId(
    capturedId: CapturedId
  ): Promise<VerificationResult> {
    console.log('🚀 ~ createIdCapture ~ capturedId:', capturedId);

    return {
      // vizMrzComparisonResult: capturedId.mrzResult
      //   ? await mrzComparisonVerifier.verify(capturedId)
      //   : null,
      aamvaVizBarcodeComparisonResult: capturedId.vizResult
        ? await comparisonVerifier.verify(capturedId)
        : null,
      aamvaBarcodeVerificationResult: capturedId.aamvaBarcodeResult
        ? await barcodeVerifier.verify(capturedId)
        : null,
    };
  }

  // Setup the listener to get notified about results
  idCapture.addListener({
    didCaptureId: async (
      idCaptureInstance: IdCapture,
      session: IdCaptureSession
    ) => {
      // Disable the IdCapture mode to handle the current result
      await idCapture.setEnabled(false);

      const capturedId = session.newlyCapturedId;
      console.log('🚀 ~ createIdCapture ~ capturedId:', capturedId);
      if (!capturedId) {
        return;
      }
      if (
        capturedId.vizResult?.isBackSideCaptureSupported === true &&
        capturedId.vizResult?.capturedSides !== SupportedSides.FrontAndBack
      ) {
        await idCapture.setEnabled(true);
        console.log(idCapture);
      } else {
        const {
          // vizMrzComparisonResult,
          aamvaVizBarcodeComparisonResult,
          aamvaBarcodeVerificationResult,
        } = await verifyScannedId(capturedId);
        console.log('has now captured the ID else loop');

        console.log({
          aamvaVizBarcodeComparisonResult,
          aamvaBarcodeVerificationResult,
        });
        // console.log(
        //   '🚀 ~ createIdCapture ~ vizMrzComparisonResult:',
        //   vizMrzComparisonResult
        // );
        console.log(
          '🚀 ~ createIdCapture ~ aamvaVizBarcodeComparisonResult:',
          aamvaVizBarcodeComparisonResult
        );
        console.log(
          '🚀 ~ createIdCapture ~ aamvaBarcodeVerificationResult:',
          aamvaBarcodeVerificationResult
        );
        if (
          //vizMrzComparisonResult?.checksPassed ||
          aamvaVizBarcodeComparisonResult?.checksPassed ||
          aamvaBarcodeVerificationResult?.allChecksPassed
        ) {
          UI.showResult(capturedId, true);
        } else {
          UI.showResult(capturedId, false);
        }
        await idCapture.reset();
      }
    },
    didRejectId: async () => {
      await idCapture.setEnabled(false);
      UI.showWarning('Document type not supported.');
      void idCapture.reset();
    },
    didFailWithError: (_: IdCapture, error: IdCaptureError) => {
      // If an error occured and the SDK recovered from it, we need to inform the user and reset the process.
      if (error.type === IdCaptureErrorCode.RecoveredAfterFailure) {
        UI.showWarning(
          'Oops, something went wrong. Please start over by scanning the front-side of your document.'
        );
        void idCapture.reset();
      }
    },
  });

  // Apply a new overlay for the newly created IdCapture mode
  await view.removeOverlay(overlay);
  overlay = await IdCaptureOverlay.withIdCaptureForView(idCapture, view);
}
async function run(): Promise<void> {
  // To visualize the ongoing loading process on screen, the view must be connected before the configure phase.
  view = new DataCaptureView();

  // Connect the data capture view to the HTML element.
  view.connectToElement(UI.elements.dataCaptureView);

  // Show the progress bar
  view.showProgressBar();

  // Configure the library
  await configure({
    licenseKey: LICENSE_KEY,
    libraryLocation: new URL('library/engine/', document.baseURI).toString(),
    moduleLoaders: [idCaptureLoader({ enableVIZDocuments: true })],
  });

  // Hide progress bar
  view.hideProgressBar();

  // Create the context (it will use the license key passed to configure by default)
  context = await DataCaptureContext.create();

  await view.setContext(context);

  // Set the default camera as frame source. Apply the recommended settings from the IdCapture mode.
  camera = Camera.default;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const settings: CameraSettings = IdCapture.recommendedCameraSettings;
  await camera.applySettings(settings);
  await context.setFrameSource(camera);

  view.addControl(new CameraSwitchControl());

  // Enable the mode selected by default
  currentMode = UI.getSelectedMode() as Mode;

  await createIdCapture(createIdCaptureSettingsFor(currentMode));
  // Disable the IdCapture mode until the camera is accessed
  await idCapture.setEnabled(false);

  // Finally, switch on the camera
  await camera.switchToDesiredState(FrameSourceState.On);
  await idCapture.setEnabled(true);
}

window.dispatchAction = async (...arguments_) => {
  const [action] = arguments_;
  switch (action) {
    case UI.Action.SWITCH_MODE:
      {
        const [, mode, buttonElement] = arguments_;
        if (mode === currentMode) {
          return;
        }
        UI.onModeSwitched(buttonElement);
        currentMode = mode;
        await idCapture.applySettings(createIdCaptureSettingsFor(currentMode));
      }
      break;
    case UI.Action.CLOSE_RESULT:
      UI.closeResults();
      window.location.replace('https://rented123.com');
      await idCapture.setEnabled(true);
      break;
    case UI.Action.CLOSE_WARNING:
      UI.closeDialog();
      await idCapture.setEnabled(true);
      break;
    case UI.Action.SCAN_BACKSIDE:
      await idCapture.setEnabled(true);
      UI.closeDialog();
      break;
    case UI.Action.SKIP_BACKSIDE: {
      UI.closeDialog();
      const [, capturedId] = arguments_;
      UI.showResult(capturedId);
      void idCapture.reset();
      break;
    }
  }
};

run().catch((error) => {
  console.error(error);
  alert(JSON.stringify(error, null, 2));
});

/* type ActionParameters<A extends UI.Action> = A extends UI.Action.SWITCH_MODE
  ? [mode: Mode, button: HTMLButtonElement]
  : A extends UI.Action.SKIP_BACKSIDE
    ? [CapturedId]
    : never;

declare global {
  interface Window {
    dispatchAction: <A extends UI.Action>(
      ...arguments: A extends UI.Action.SKIP_BACKSIDE | UI.Action.SWITCH_MODE
        ? [action: A, ...args: ActionParameters<A>]
        : [action: A]
    ) => void;
  }
}
 */
