//ui
import * as SDCId from 'scandit-web-datacapture-id';
import jsPDF from 'jspdf';

export enum Action {
  SWITCH_MODE = 'SWITCH_MODE',
  CLOSE_RESULT = 'CLOSE_RESULT',
  SCAN_BACKSIDE = 'SCAN_BACKSIDE',
  SKIP_BACKSIDE = 'SKIP_BACKSIDE',
  CLOSE_WARNING = 'CLOSE_WARNING',
}

export const elements = {
  dataCaptureView: document.getElementById(
    'data-capture-view'
  ) as HTMLDivElement,
  selector: document.getElementById('selector') as HTMLDivElement,
  alert: document.getElementById('alert') as HTMLDivElement,
  result: document.getElementById('result') as HTMLDivElement,
  resultContent: document.getElementById('result-content') as HTMLDivElement,
  resultHeader: document.getElementById('result-header') as HTMLDivElement,
  resultFooter: document.getElementById('result-footer') as HTMLDivElement,
};

export function getSelectedMode(): string {
  return (elements.selector.querySelector('button.active') as HTMLElement)
    .dataset.mode!;
}

export function onModeSwitched(buttonElement: HTMLButtonElement): void {
  elements.selector.querySelector('button.active')?.classList.remove('active');
  buttonElement.classList.add('active');
}

export function confirmScanningBackside(capturedId: SDCId.CapturedId): void {
  elements.alert.innerHTML = `
    <p>This document has additional data on the back of the card.</p>
    <div>
      <button skip>Skip</button>
      <button onclick="window.dispatchAction('SCAN_BACKSIDE')">Scan</button>
    </div>
  `;
  const skipButton = elements.alert.querySelector('button[skip]')!;
  skipButton.addEventListener('click', () => {
    window.dispatchAction(Action.SKIP_BACKSIDE, capturedId);
  });
  elements.alert.removeAttribute('hidden');
}

export function showWarning(text: string): void {
  elements.alert.innerHTML = `
    <p></p>
    <div class="single">
      <button onclick="window.dispatchAction('CLOSE_WARNING')">Close</button>
    </div>
  `;
  const skipButton = elements.alert.querySelector('button[print]')!;
  skipButton.addEventListener('click', () => {
    console.log('PRINT::::::::::::');
  });
  elements.alert.querySelector('p')!.textContent = text;
  elements.alert.removeAttribute('hidden');
}

function getDOMOfFormattedValue(value: unknown): HTMLElement {
  const paragraph = document.createElement('p');
  const emptyElement = document.createElement('i');
  emptyElement.textContent = 'empty';

  if (value == null || value === '') {
    paragraph.append(emptyElement);
    return paragraph;
  }

  if (typeof value === 'boolean') {
    paragraph.textContent = value ? 'yes' : 'no';
    return paragraph;
  }

  if (value instanceof SDCId.DateResult) {
    if (
      typeof value.day === 'number' &&
      typeof value.month === 'number' &&
      typeof value.year === 'number'
    ) {
      const d = new Date(value.year, value.month - 1, value.day);
      paragraph.textContent = d.toLocaleDateString();
      return paragraph;
    }
    paragraph.append(emptyElement);
    return paragraph;
  }

  if (value instanceof SDCId.ProfessionalDrivingPermit) {
    const div = document.createElement('div');
    div.append(getFragmentForLabelAndValue('Codes', value.codes));
    div.append(
      getFragmentForLabelAndValue('Date of Expiry', value.dateOfExpiry)
    );
    return div;
  }

  if (value instanceof SDCId.VehicleRestriction) {
    const div = document.createElement('div');
    div.append(getFragmentForLabelAndValue('Vehicle Code', value.vehicleCode));
    div.append(
      getFragmentForLabelAndValue(
        'Vehicle Restriction',
        value.vehicleRestriction
      )
    );
    div.append(getFragmentForLabelAndValue('Date of Issue', value.dateOfIssue));

    return div;
  }

  if (Array.isArray(value)) {
    for (const element of value) {
      paragraph.append(getDOMOfFormattedValue(element));
    }
    return paragraph;
  }

  paragraph.textContent = value as string;

  return paragraph;
}

function getDOMForLabel(labelText: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.className = 'label';
  paragraph.textContent = labelText;

  return paragraph;
}

function getFragmentForLabelAndValue(
  labelText: string,
  value: unknown
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(getDOMForLabel(labelText));
  fragment.append(getDOMOfFormattedValue(value));

  return fragment;
}

function getFragmentForFields(fields: [string, unknown][]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const [label, value] of fields) {
    fragment.append(getFragmentForLabelAndValue(label, value));
  }
  return fragment;
}

const svgIcons = {
  warn: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.0066 20C8.02745 20.0026 6.09206 19.4174 4.44584 18.3187C2.79961 17.22 1.5167 15.6572 0.759759 13.8285C0.00281289 11.9998 -0.19408 9.98747 0.194044 8.04671C0.582167 6.10594 1.53783 4.32412 2.93986 2.92716C3.86788 1.99913 4.96961 1.26299 6.18213 0.760744C7.39465 0.258501 8.69422 0 10.0066 0C11.3191 0 12.6186 0.258501 13.8312 0.760744C15.0437 1.26299 16.1454 1.99913 17.0734 2.92716C18.0015 3.85518 18.7376 4.95691 19.2398 6.16943C19.7421 7.38195 20.0006 8.68152 20.0006 9.99394C20.0006 11.3064 19.7421 12.6059 19.2398 13.8185C18.7376 15.031 18.0015 16.1327 17.0734 17.0607C16.1484 17.9936 15.0475 18.7337 13.8344 19.2382C12.6214 19.7427 11.3204 20.0017 10.0066 20ZM10.0066 2.48939C8.52238 2.48939 7.07146 2.92953 5.83734 3.75414C4.60322 4.57875 3.64135 5.7508 3.07334 7.12208C2.50534 8.49335 2.35673 10.0023 2.64629 11.458C2.93586 12.9137 3.6506 14.2509 4.70013 15.3005C5.74966 16.35 7.08684 17.0647 8.54258 17.3543C9.99832 17.6439 11.5072 17.4952 12.8785 16.9272C14.2498 16.3592 15.4218 15.3974 16.2464 14.1632C17.0711 12.9291 17.5112 11.4782 17.5112 9.99394C17.5089 8.00432 16.7175 6.09686 15.3106 4.68998C13.9037 3.28311 11.9963 2.49171 10.0066 2.48939ZM11.2574 5.9909C11.2574 5.43861 10.8097 4.9909 10.2574 4.9909H9.75592C9.20363 4.9909 8.75592 5.43861 8.75592 5.9909V10.2447C8.75592 10.797 9.20363 11.2447 9.75592 11.2447H10.2574C10.8097 11.2447 11.2574 10.797 11.2574 10.2447V5.9909ZM11.2574 13.7462C11.2574 14.437 10.6975 14.997 10.0067 14.997C9.3159 14.997 8.75592 14.437 8.75592 13.7462C8.75592 13.0554 9.3159 12.4954 10.0067 12.4954C10.6975 12.4954 11.2574 13.0554 11.2574 13.7462Z" fill="#FA4446"/>
    </svg>`,
  checkmark: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M4.4443 18.3147C6.08879 19.4135 8.02219 20 10 20C12.6513 19.997 15.1931 18.9425 17.0678 17.0678C18.9425 15.1931 19.997 12.6513 20 10C20 8.02219 19.4135 6.08879 18.3147 4.4443C17.2159 2.79981 15.6541 1.51809 13.8268 0.761209C11.9996 0.00433284 9.98891 -0.1937 8.0491 0.192152C6.10929 0.578004 4.32746 1.53041 2.92894 2.92894C1.53041 4.32746 0.578004 6.10929 0.192152 8.0491C-0.1937 9.98891 0.00433284 11.9996 0.761209 13.8268C1.51809 15.6541 2.79981 17.2159 4.4443 18.3147ZM5.83323 3.76398C7.0666 2.93987 8.51664 2.5 10 2.5C11.9884 2.50232 13.8947 3.29324 15.3007 4.69926C16.7068 6.10528 17.4977 8.01159 17.5 10C17.5 11.4834 17.0601 12.9334 16.236 14.1668C15.4119 15.4001 14.2406 16.3614 12.8701 16.9291C11.4997 17.4968 9.99168 17.6453 8.53683 17.3559C7.08197 17.0665 5.7456 16.3522 4.6967 15.3033C3.64781 14.2544 2.9335 12.918 2.64411 11.4632C2.35473 10.0083 2.50325 8.50032 3.07091 7.12988C3.63856 5.75943 4.59986 4.58809 5.83323 3.76398ZM8.04289 13.5604C8.43341 13.9509 9.06658 13.9509 9.4571 13.5604L14.8104 8.20711C15.2009 7.81658 15.2009 7.18342 14.8104 6.79289L14.4571 6.43961C14.0666 6.04908 13.4334 6.04908 13.0429 6.43961L8.75 10.7325L6.9571 8.93961C6.56658 8.54908 5.93341 8.54908 5.54289 8.93961L5.1896 9.29289C4.79908 9.68342 4.79908 10.3166 5.1896 10.7071L8.04289 13.5604Z" fill="#28D380"/>
    </svg>`,
  timer: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.0066 20C8.02745 20.0026 6.09206 19.4174 4.44584 18.3187C2.79961 17.22 1.5167 15.6572 0.759759 13.8285C0.00281288 11.9998 -0.19408 9.98747 0.194044 8.04671C0.582167 6.10594 1.53783 4.32412 2.93986 2.92716C3.86788 1.99913 4.96961 1.26299 6.18213 0.760744C7.39465 0.258501 8.69422 9.77832e-09 10.0066 0C11.3191 -9.77831e-09 12.6186 0.258501 13.8312 0.760744C15.0437 1.26299 16.1454 1.99913 17.0734 2.92716C18.0015 3.85518 18.7376 4.95691 19.2398 6.16943C19.7421 7.38195 20.0006 8.68152 20.0006 9.99394C20.0006 11.3064 19.7421 12.6059 19.2398 13.8185C18.7376 15.031 18.0015 16.1327 17.0734 17.0607C16.1484 17.9936 15.0475 18.7337 13.8344 19.2382C12.6214 19.7427 11.3204 20.0017 10.0066 20ZM10.0066 2.48939C8.52238 2.48939 7.07146 2.92953 5.83734 3.75414C4.60322 4.57875 3.64135 5.7508 3.07334 7.12208C2.50534 8.49335 2.35673 10.0023 2.64629 11.458C2.93586 12.9137 3.6506 14.2509 4.70013 15.3005C5.74966 16.35 7.08684 17.0647 8.54258 17.3543C9.99832 17.6439 11.5072 17.4952 12.8785 16.9272C14.2498 16.3592 15.4218 15.3974 16.2464 14.1632C17.0711 12.9291 17.5112 11.4782 17.5112 9.99394C17.5089 8.00432 16.7175 6.09686 15.3106 4.68998C13.9037 3.28311 11.9963 2.49171 10.0066 2.48939Z" fill="#FBC02C"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.75592 6.24166C8.75592 5.55089 9.3159 4.99091 10.0067 4.99091C10.6975 4.99091 11.2574 5.55089 11.2574 6.24166V9.36856L13.759 9.36856C14.4497 9.36856 15.0097 9.92854 15.0097 10.6193C15.0097 11.3101 14.4497 11.8701 13.759 11.8701H10.626C9.59318 11.8701 8.75592 11.0328 8.75592 10V9.36856V6.24166Z" fill="#FBC02C"/>
    </svg>
  `,
};

function getPanel(
  type: 'passed' | 'timer' | 'warn',
  text: string,
  extraAttributes: Record<string, string> = {}
): DocumentFragment {
  let iconType: keyof typeof svgIcons = 'checkmark';
  if (type === 'warn') iconType = 'warn';
  if (type === 'timer') iconType = 'timer';

  const fragment = document.createDocumentFragment();
  const panel = document.createElement('div');
  panel.classList.add('panel', `panel--${type}`);
  for (const [key, value] of Object.entries(extraAttributes)) {
    panel.setAttribute(key, value);
  }
  const content = document.createElement('p');
  content.className = 'panel-content';
  // eslint-disable-next-line no-unsanitized/property
  content.innerHTML = svgIcons[iconType];
  panel.append(content);

  const textElement = document.createElement('span');
  textElement.textContent = text;
  content.append(textElement);

  fragment.append(panel);

  return fragment;
}

export function showResult(
  capturedId: SDCId.CapturedId,
  isDocumentVerified = false
): void {
  const result = document.createDocumentFragment();

  // Scanned document result modal Header
  const header = isDocumentVerified
    ? 'Document verified successfully'
    : 'Document is not verified';

  if (capturedId.idImageOfType(SDCId.IdImageType.Face) != null) {
    result.append(getDOMForLabel('Face'));
    const faceImage = new Image();
    faceImage.src = `data:image/png;base64,${capturedId.idImageOfType(SDCId.IdImageType.Face) ?? ''}`;
    result.append(faceImage);
  }

  const fields: [string, unknown][] = [];
  if (capturedId.firstName) fields.push(['First Name', capturedId.firstName]);
  if (capturedId.lastName) fields.push(['Last Name', capturedId.lastName]);
  if (capturedId.fullName) fields.push(['Full Name', capturedId.fullName]);
  if (capturedId.sex) fields.push(['Sex', capturedId.sex]);
  if (capturedId.dateOfBirth)
    fields.push(['Date of Birth', capturedId.dateOfBirth]);
  if (capturedId.age) fields.push(['Age', capturedId.age]);
  if (capturedId.nationality)
    fields.push(['Nationality', capturedId.nationality]);
  if (capturedId.address) fields.push(['Address', capturedId.address]);
  if (capturedId.documentType)
    fields.push(['Document Type', capturedId.documentType]);
  if (capturedId.issuingCountryIso)
    fields.push(['Issuing Country ISO', capturedId.issuingCountryIso]);
  if (capturedId.issuingCountry)
    fields.push(['Issuing Country', capturedId.issuingCountry]);
  if (capturedId.documentNumber)
    fields.push(['Document Number', capturedId.documentNumber]);
  if (capturedId.documentAdditionalNumber)
    fields.push([
      'Document Additional Number',
      capturedId.documentAdditionalNumber,
    ]);
  if (capturedId.dateOfExpiry)
    fields.push(['Date of Expiry', capturedId.dateOfExpiry]);
  if (capturedId.isExpired) fields.push(['Is Expired', capturedId.isExpired]);
  if (capturedId.dateOfIssue)
    fields.push(['Date of Issue', capturedId.dateOfIssue]);

  if (fields.length) result.append(getFragmentForFields(fields));

  if (capturedId.aamvaBarcodeResult) {
    const data = capturedId.aamvaBarcodeResult;

    const aamvaBarcodeResultFields: [string, unknown][] = [];

    if (data.aamvaVersion)
      aamvaBarcodeResultFields.push(['AAMVA Version', data.aamvaVersion]);
    if (data.isRealId)
      aamvaBarcodeResultFields.push(['Is Real ID', data.isRealId]);
    if (data.aliasFamilyName)
      aamvaBarcodeResultFields.push([
        'Alias Family Name',
        data.aliasFamilyName,
      ]);
    if (data.aliasGivenName)
      aamvaBarcodeResultFields.push(['Alias Given Name', data.aliasGivenName]);
    if (data.aliasSuffixName)
      aamvaBarcodeResultFields.push([
        'Alias Suffix Name',
        data.aliasSuffixName,
      ]);
    if (data.driverNamePrefix)
      aamvaBarcodeResultFields.push([
        'Driver Name Prefix',
        data.driverNamePrefix,
      ]);
    if (data.driverNameSuffix)
      aamvaBarcodeResultFields.push([
        'Driver Name Suffix',
        data.driverNameSuffix,
      ]);
    if (data.endorsementsCode)
      aamvaBarcodeResultFields.push([
        'Endorsements Code',
        data.endorsementsCode,
      ]);
    if (data.eyeColor)
      aamvaBarcodeResultFields.push(['Eye Color', data.eyeColor]);
    if (data.firstNameTruncation)
      aamvaBarcodeResultFields.push([
        'First Name Truncation',
        data.firstNameTruncation,
      ]);
    if (data.hairColor)
      aamvaBarcodeResultFields.push(['Hair Color', data.hairColor]);
    if (data.heightCm)
      aamvaBarcodeResultFields.push(['Height CM', data.heightCm]);
    if (data.heightInch)
      aamvaBarcodeResultFields.push(['Height Inch', data.heightInch]);
    if (data.IIN) aamvaBarcodeResultFields.push(['IIN', data.IIN]);
    if (data.issuingJurisdiction)
      aamvaBarcodeResultFields.push([
        'Issuing Jurisdiction',
        data.issuingJurisdiction,
      ]);
    if (data.issuingJurisdictionIso)
      aamvaBarcodeResultFields.push([
        'Issuing Jurisdiction ISO',
        data.issuingJurisdictionIso,
      ]);
    if (data.jurisdictionVersion)
      aamvaBarcodeResultFields.push([
        'Jurisdiction Version',
        data.jurisdictionVersion,
      ]);
    if (data.lastNameTruncation)
      aamvaBarcodeResultFields.push([
        'Last Name Truncation',
        data.lastNameTruncation,
      ]);
    if (data.firstNameWithoutMiddleName)
      aamvaBarcodeResultFields.push([
        'First Name Without Middle Name',
        data.firstNameWithoutMiddleName,
      ]);
    if (data.middleName)
      aamvaBarcodeResultFields.push(['Middle Name', data.middleName]);
    if (data.middleNameTruncation)
      aamvaBarcodeResultFields.push([
        'Middle Name Truncation',
        data.middleNameTruncation,
      ]);
    if (data.placeOfBirth)
      aamvaBarcodeResultFields.push(['Place Of Birth', data.placeOfBirth]);
    if (data.race) aamvaBarcodeResultFields.push(['Race', data.race]);
    if (data.restrictionsCode)
      aamvaBarcodeResultFields.push([
        'Restrictions Code',
        data.restrictionsCode,
      ]);
    if (data.vehicleClass)
      aamvaBarcodeResultFields.push(['Vehicle Class', data.vehicleClass]);
    if (data.weightKg)
      aamvaBarcodeResultFields.push(['Weight Kg', data.weightKg]);
    if (data.weightLbs)
      aamvaBarcodeResultFields.push(['Weight Lbs', data.weightLbs]);
    if (data.cardRevisionDate)
      aamvaBarcodeResultFields.push([
        'Card Revision Date',
        data.cardRevisionDate,
      ]);
    if (data.documentDiscriminatorNumber)
      aamvaBarcodeResultFields.push([
        'Document Discriminator Number',
        data.documentDiscriminatorNumber,
      ]);
    if (data.barcodeDataElements)
      aamvaBarcodeResultFields.push([
        'Barcode Data Elements',
        data.barcodeDataElements,
      ]);

    if (aamvaBarcodeResultFields.length)
      result.append(getFragmentForFields(aamvaBarcodeResultFields));
  }

  if (capturedId.argentinaIdBarcodeResult) {
    const argentinaIdBarcodeResultFields: [string, unknown][] = [];

    if (capturedId.argentinaIdBarcodeResult.personalIdNumber)
      argentinaIdBarcodeResultFields.push([
        'Personal Id Number',
        capturedId.argentinaIdBarcodeResult.personalIdNumber,
      ]);
    if (capturedId.argentinaIdBarcodeResult.documentCopy)
      argentinaIdBarcodeResultFields.push([
        'Document Copy',
        capturedId.argentinaIdBarcodeResult.documentCopy,
      ]);

    if (argentinaIdBarcodeResultFields.length)
      result.append(getFragmentForFields(argentinaIdBarcodeResultFields));
  }

  if (capturedId.apecBusinessTravelCardMrzResult) {
    const data = capturedId.apecBusinessTravelCardMrzResult;

    const apecBusinessTravelCardMrzResultFields: [string, unknown][] = [];

    if (data.documentCode)
      apecBusinessTravelCardMrzResultFields.push([
        'Document Code',
        data.documentCode,
      ]);
    if (data.capturedMrz)
      apecBusinessTravelCardMrzResultFields.push([
        'Captured MRZ',
        data.capturedMrz,
      ]);
    if (data.passportNumber)
      apecBusinessTravelCardMrzResultFields.push([
        'Passport Number',
        data.passportNumber,
      ]);
    if (data.passportIssuerIso)
      apecBusinessTravelCardMrzResultFields.push([
        'Passport Issuer ISO',
        data.passportIssuerIso,
      ]);
    if (data.passportDateOfExpiry)
      apecBusinessTravelCardMrzResultFields.push([
        'Passport Date of Expiry',
        data.passportDateOfExpiry,
      ]);

    if (apecBusinessTravelCardMrzResultFields.length)
      result.append(
        getFragmentForFields(apecBusinessTravelCardMrzResultFields)
      );
  }

  if (capturedId.chinaMainlandTravelPermitMrzResult) {
    const data = capturedId.chinaMainlandTravelPermitMrzResult;

    const chinaMainlandTravelPermitMrzResultFields: [string, unknown][] = [];

    if (data.documentCode)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Document Code',
        data.documentCode,
      ]);
    if (data.capturedMrz)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Captured MRZ',
        data.capturedMrz,
      ]);
    if (data.personalIdNumber)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Personal ID Number',
        data.personalIdNumber,
      ]);
    if (data.renewalTimes)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Renewal times',
        data.renewalTimes,
      ]);
    if (data.fullNameSimplifiedChinese)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Full Name Simplified Chinese',
        data.fullNameSimplifiedChinese,
      ]);
    if (data.omittedCharacterCountInGBKName)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Omitted Character Count In GBK Name',
        data.omittedCharacterCountInGBKName,
      ]);
    if (data.omittedNameCount)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Omitted Name Count',
        data.omittedNameCount,
      ]);
    if (data.issuingAuthorityCode)
      chinaMainlandTravelPermitMrzResultFields.push([
        'Issuing Authority Code',
        data.issuingAuthorityCode,
      ]);

    if (chinaMainlandTravelPermitMrzResultFields.length)
      result.append(
        getFragmentForFields(chinaMainlandTravelPermitMrzResultFields)
      );
  }

  if (capturedId.chinaExitEntryPermitMrzResult) {
    const chinaExitEntryPermitMrzResultFields: [string, unknown][] = [];

    if (capturedId.chinaExitEntryPermitMrzResult.documentCode)
      chinaExitEntryPermitMrzResultFields.push([
        'Document Code',
        capturedId.chinaExitEntryPermitMrzResult.documentCode,
      ]);
    if (capturedId.chinaExitEntryPermitMrzResult.capturedMrz)
      chinaExitEntryPermitMrzResultFields.push([
        'Captured MRZ',
        capturedId.chinaExitEntryPermitMrzResult.capturedMrz,
      ]);

    if (chinaExitEntryPermitMrzResultFields.length)
      result.append(getFragmentForFields(chinaExitEntryPermitMrzResultFields));
  }

  if (capturedId.chinaOneWayPermitFrontMrzResult) {
    const data = capturedId.chinaOneWayPermitFrontMrzResult;

    const chinaOneWayPermitFrontMrzResultFields: [string, unknown][] = [];

    if (data.documentCode)
      chinaOneWayPermitFrontMrzResultFields.push([
        'Document Code',
        data.documentCode,
      ]);
    if (data.fullNameSimplifiedChinese)
      chinaOneWayPermitFrontMrzResultFields.push([
        'Full Name in Simplified Chinese',
        data.fullNameSimplifiedChinese,
      ]);
    if (data.capturedMrz)
      chinaOneWayPermitFrontMrzResultFields.push([
        'Captured MRZ',
        data.capturedMrz,
      ]);

    if (chinaOneWayPermitFrontMrzResultFields.length)
      result.append(
        getFragmentForFields(chinaOneWayPermitFrontMrzResultFields)
      );
  }

  if (capturedId.chinaOneWayPermitBackMrzResult) {
    const data = capturedId.chinaOneWayPermitBackMrzResult;

    const chinaOneWayPermitBackMrzResultFields: [string, unknown][] = [];

    if (data.documentCode)
      chinaOneWayPermitBackMrzResultFields.push([
        'Document Code',
        data.documentCode,
      ]);
    if (data.namesAreTruncated)
      chinaOneWayPermitBackMrzResultFields.push([
        'Names Are Truncated',
        data.namesAreTruncated,
      ]);
    if (data.capturedMrz)
      chinaOneWayPermitBackMrzResultFields.push([
        'Captured MRZ',
        data.capturedMrz,
      ]);

    if (chinaOneWayPermitBackMrzResultFields.length)
      result.append(getFragmentForFields(chinaOneWayPermitBackMrzResultFields));
  }

  if (capturedId.colombiaIdBarcodeResult) {
    if (capturedId.colombiaIdBarcodeResult.bloodType) {
      result.append(
        getFragmentForFields([
          ['Blood Type', capturedId.colombiaIdBarcodeResult.bloodType],
        ])
      );
    }
  }

  if (capturedId.colombiaDlBarcodeResult) {
    const colombiaDlBarcodeResultFields: [string, unknown][] = [];

    if (capturedId.colombiaDlBarcodeResult.identificationType)
      colombiaDlBarcodeResultFields.push([
        'Identification Type',
        capturedId.colombiaDlBarcodeResult.identificationType,
      ]);
    if (capturedId.colombiaDlBarcodeResult.categories)
      colombiaDlBarcodeResultFields.push([
        'Categories',
        capturedId.colombiaDlBarcodeResult.categories,
      ]);

    if (colombiaDlBarcodeResultFields.length)
      result.append(getFragmentForFields(colombiaDlBarcodeResultFields));
  }

  if (capturedId.mrzResult) {
    const data = capturedId.mrzResult;
    const mrzResultFields: [string, unknown][] = [];

    if (data.documentCode)
      mrzResultFields.push(['Document Code', data.documentCode]);
    if (data.namesAreTruncated)
      mrzResultFields.push(['Names Are Truncated', data.namesAreTruncated]);
    if (data.optional) mrzResultFields.push(['Optional', data.optional]);
    if (data.optional1) mrzResultFields.push(['Optional1', data.optional1]);
    if (data.capturedMrz)
      mrzResultFields.push(['Captured Mrz', data.capturedMrz]);

    if (mrzResultFields.length)
      result.append(getFragmentForFields(mrzResultFields));
  }

  if (capturedId.usVisaVIZResult) {
    const data = capturedId.usVisaVIZResult;

    const usVisaVIZResultFields: [string, unknown][] = [];

    if (data.visaNumber)
      usVisaVIZResultFields.push(['Visa Number', data.visaNumber]);
    if (data.passportNumber)
      usVisaVIZResultFields.push(['Passport Number', data.passportNumber]);

    if (usVisaVIZResultFields.length)
      result.append(getFragmentForFields(usVisaVIZResultFields));
  }

  if (capturedId.southAfricaIdBarcodeResult) {
    const data = capturedId.southAfricaIdBarcodeResult;

    const southAfricaIdBarcodeResultFields: [string, unknown][] = [];

    if (data.countryOfBirth)
      southAfricaIdBarcodeResultFields.push([
        'Country Of Birth',
        data.countryOfBirth,
      ]);
    if (data.countryOfBirthIso)
      southAfricaIdBarcodeResultFields.push([
        'Country Of Birth Iso',
        data.countryOfBirthIso,
      ]);
    if (data.citizenshipStatus)
      southAfricaIdBarcodeResultFields.push([
        'Citizenship Status',
        data.citizenshipStatus,
      ]);
    if (data.personalIdNumber)
      southAfricaIdBarcodeResultFields.push([
        'Personal Id Number',
        data.personalIdNumber,
      ]);

    if (southAfricaIdBarcodeResultFields.length)
      result.append(getFragmentForFields(southAfricaIdBarcodeResultFields));
  }

  if (capturedId.southAfricaDlBarcodeResult) {
    const data = capturedId.southAfricaDlBarcodeResult;

    const southAfricaDlBarcodeResultFields: [string, unknown][] = [];

    if (data.version)
      southAfricaDlBarcodeResultFields.push(['Version', data.version]);
    if (data.licenseCountryOfIssue)
      southAfricaDlBarcodeResultFields.push([
        'License Country Of Issue',
        data.licenseCountryOfIssue,
      ]);
    if (data.personalIdNumber)
      southAfricaDlBarcodeResultFields.push([
        'Personal Id Number',
        data.personalIdNumber,
      ]);
    if (data.personalIdNumberType)
      southAfricaDlBarcodeResultFields.push([
        'Personal Id Number Type',
        data.personalIdNumberType,
      ]);
    if (data.documentCopy)
      southAfricaDlBarcodeResultFields.push([
        'Document Copy',
        data.documentCopy,
      ]);
    if (data.driverRestrictionCodes)
      southAfricaDlBarcodeResultFields.push([
        'Driver Restriction Codes',
        data.driverRestrictionCodes,
      ]);
    if (data.professionalDrivingPermit)
      southAfricaDlBarcodeResultFields.push([
        'Professional Driving Permit',
        data.professionalDrivingPermit,
      ]);
    if (data.vehicleRestrictions)
      southAfricaDlBarcodeResultFields.push([
        'Vehicle Restrictions',
        data.vehicleRestrictions,
      ]);

    if (southAfricaDlBarcodeResultFields.length)
      result.append(getFragmentForFields(southAfricaDlBarcodeResultFields));
  }

  if (capturedId.usUniformedServicesBarcodeResult) {
    const data = capturedId.usUniformedServicesBarcodeResult;

    const usUniformedServicesBarcodeResultFields: [string, unknown][] = [];

    if (data.bloodType)
      usUniformedServicesBarcodeResultFields.push([
        'Blood Type',
        data.bloodType,
      ]);
    if (data.branchOfService)
      usUniformedServicesBarcodeResultFields.push([
        'Branch Of Service',
        data.branchOfService,
      ]);
    if (data.champusEffectiveDate)
      usUniformedServicesBarcodeResultFields.push([
        'Champus Effective Date',
        data.champusEffectiveDate,
      ]);
    if (data.champusExpiryDate)
      usUniformedServicesBarcodeResultFields.push([
        'Champus Expiry Date',
        data.champusExpiryDate,
      ]);
    if (data.civilianHealthCareFlagCode)
      usUniformedServicesBarcodeResultFields.push([
        'Civilian Health Care Flag Code',
        data.civilianHealthCareFlagCode,
      ]);
    if (data.civilianHealthCareFlagDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Civilian Health Care Flag Description',
        data.civilianHealthCareFlagDescription,
      ]);
    if (data.commissaryFlagCode)
      usUniformedServicesBarcodeResultFields.push([
        'Commissary Flag Code',
        data.commissaryFlagCode,
      ]);
    if (data.commissaryFlagDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Commissary Flag Description',
        data.commissaryFlagDescription,
      ]);
    if (data.deersDependentSuffixCode)
      usUniformedServicesBarcodeResultFields.push([
        'Deers Dependent Suffix Code',
        data.deersDependentSuffixCode,
      ]);
    if (data.deersDependentSuffixDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Deers Dependent Suffix Description',
        data.deersDependentSuffixDescription,
      ]);
    if (data.directCareFlagCode)
      usUniformedServicesBarcodeResultFields.push([
        'Direct Care Flag Code',
        data.directCareFlagCode,
      ]);
    if (data.directCareFlagDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Direct Care Flag Description',
        data.directCareFlagDescription,
      ]);
    if (data.exchangeFlagCode)
      usUniformedServicesBarcodeResultFields.push([
        'Exchange Flag Code',
        data.exchangeFlagCode,
      ]);
    if (data.exchangeFlagDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Exchange Flag Description',
        data.exchangeFlagDescription,
      ]);
    if (data.eyeColor)
      usUniformedServicesBarcodeResultFields.push(['Eye Color', data.eyeColor]);
    if (data.familySequenceNumber)
      usUniformedServicesBarcodeResultFields.push([
        'Family Sequence Number',
        data.familySequenceNumber,
      ]);
    if (data.formNumber)
      usUniformedServicesBarcodeResultFields.push([
        'Form Number',
        data.formNumber,
      ]);
    if (data.genevaConventionCategory)
      usUniformedServicesBarcodeResultFields.push([
        'Geneva Convention Category',
        data.genevaConventionCategory,
      ]);
    if (data.hairColor)
      usUniformedServicesBarcodeResultFields.push([
        'Hair Color',
        data.hairColor,
      ]);
    if (data.height)
      usUniformedServicesBarcodeResultFields.push(['Height', data.height]);
    if (data.jpegData)
      usUniformedServicesBarcodeResultFields.push(['Jpeg Data', data.jpegData]);
    if (data.mwrFlagCode)
      usUniformedServicesBarcodeResultFields.push([
        'Mwr Flag Code',
        data.mwrFlagCode,
      ]);
    if (data.mwrFlagDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Mwr Flag Description',
        data.mwrFlagDescription,
      ]);
    if (data.payGrade)
      usUniformedServicesBarcodeResultFields.push(['Pay Grade', data.payGrade]);
    if (data.personDesignatorDocument)
      usUniformedServicesBarcodeResultFields.push([
        'Person Designator Document',
        data.personDesignatorDocument,
      ]);
    if (data.rank)
      usUniformedServicesBarcodeResultFields.push(['Rank', data.rank]);
    if (data.relationshipCode)
      usUniformedServicesBarcodeResultFields.push([
        'Relationship Code',
        data.relationshipCode,
      ]);
    if (data.relationshipDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Relationship Description',
        data.relationshipDescription,
      ]);
    if (data.securityCode)
      usUniformedServicesBarcodeResultFields.push([
        'Security Code',
        data.securityCode,
      ]);
    if (data.serviceCode)
      usUniformedServicesBarcodeResultFields.push([
        'Service Code',
        data.serviceCode,
      ]);
    if (data.sponsorFlag)
      usUniformedServicesBarcodeResultFields.push([
        'Sponsor Flag',
        data.sponsorFlag,
      ]);
    if (data.sponsorName)
      usUniformedServicesBarcodeResultFields.push([
        'Sponsor Name',
        data.sponsorName,
      ]);
    if (data.sponsorPersonDesignatorIdentifier)
      usUniformedServicesBarcodeResultFields.push([
        'Sponsor Person Designator Identifier',
        data.sponsorPersonDesignatorIdentifier,
      ]);
    if (data.statusCode)
      usUniformedServicesBarcodeResultFields.push([
        'Status Code',
        data.statusCode,
      ]);
    if (data.statusCodeDescription)
      usUniformedServicesBarcodeResultFields.push([
        'Status Code Description',
        data.statusCodeDescription,
      ]);
    if (data.version)
      usUniformedServicesBarcodeResultFields.push(['Version', data.version]);
    if (data.weight)
      usUniformedServicesBarcodeResultFields.push(['Weight', data.weight]);

    if (usUniformedServicesBarcodeResultFields.length)
      result.append(
        getFragmentForFields(usUniformedServicesBarcodeResultFields)
      );
  }

  if (capturedId.commonAccessCardBarcodeResult) {
    const data = capturedId.commonAccessCardBarcodeResult;

    const commonAccessCardBarcodeResultFields: [string, unknown][] = [];

    if (data.version)
      commonAccessCardBarcodeResultFields.push(['version', data.version]);
    if (data.personDesignatorDocument)
      commonAccessCardBarcodeResultFields.push([
        'person designator document',
        data.personDesignatorDocument,
      ]);
    if (data.personDesignatorTypeCode)
      commonAccessCardBarcodeResultFields.push([
        'person designator type code',
        data.personDesignatorTypeCode,
      ]);
    if (data.ediPersonIdentifier)
      commonAccessCardBarcodeResultFields.push([
        'edi person identifier',
        data.ediPersonIdentifier,
      ]);
    if (data.personnelCategoryCode)
      commonAccessCardBarcodeResultFields.push([
        'personnel category code',
        data.personnelCategoryCode,
      ]);
    if (data.branchOfService)
      commonAccessCardBarcodeResultFields.push([
        'branch of service',
        data.branchOfService,
      ]);
    if (data.personnelEntitlementConditionType)
      commonAccessCardBarcodeResultFields.push([
        'personnel entitlement condition type',
        data.personnelEntitlementConditionType,
      ]);
    if (data.rank)
      commonAccessCardBarcodeResultFields.push(['rank', data.rank]);
    if (data.payPlanCode)
      commonAccessCardBarcodeResultFields.push([
        'play pan code',
        data.payPlanCode,
      ]);
    if (data.payPlanGradeCode)
      commonAccessCardBarcodeResultFields.push([
        'play pan grade code',
        data.payPlanGradeCode,
      ]);
    if (data.cardInstanceIdentifier)
      commonAccessCardBarcodeResultFields.push([
        'card instance identifier',
        data.cardInstanceIdentifier,
      ]);
    if (data.personMiddleInitial)
      commonAccessCardBarcodeResultFields.push([
        'person middle initial',
        data.personMiddleInitial,
      ]);

    if (commonAccessCardBarcodeResultFields.length)
      result.append(getFragmentForFields(commonAccessCardBarcodeResultFields));
  }

  if (capturedId.vizResult) {
    const data = capturedId.vizResult;

    const vizResultFields: [string, unknown][] = [];

    if (data.additionalAddressInformation)
      vizResultFields.push([
        'Additional Address Information',
        data.additionalAddressInformation,
      ]);
    if (data.additionalNameInformation)
      vizResultFields.push([
        'Additional Name Information',
        data.additionalNameInformation,
      ]);
    if (data.documentAdditionalNumber)
      vizResultFields.push([
        'Document Additional Number',
        data.documentAdditionalNumber,
      ]);
    if (data.employer) vizResultFields.push(['Employer', data.employer]);
    if (data.issuingAuthority)
      vizResultFields.push(['Issuing Authority', data.issuingAuthority]);
    if (data.issuingJurisdiction)
      vizResultFields.push(['Issuing Jurisdiction', data.issuingJurisdiction]);
    if (data.maritalStatus)
      vizResultFields.push(['Marital Status', data.maritalStatus]);
    if (data.personalIdNumber)
      vizResultFields.push(['Personal Id Number', data.personalIdNumber]);
    if (data.placeOfBirth)
      vizResultFields.push(['Place Of Birth', data.placeOfBirth]);
    if (data.profession) vizResultFields.push(['Profession', data.profession]);
    if (data.race) vizResultFields.push(['Race', data.race]);
    if (data.religion) vizResultFields.push(['Religion', data.religion]);
    if (data.residentialStatus)
      vizResultFields.push(['Residential Status', data.residentialStatus]);
    if (data.capturedSides)
      vizResultFields.push(['Captured Sides', data.capturedSides]);
    if (data.isBackSideCaptureSupported)
      vizResultFields.push([
        'Is Back Side Capture Supported',
        data.isBackSideCaptureSupported,
      ]);

    if (vizResultFields.length)
      result.append(getFragmentForFields(vizResultFields));
  }

  const printButton = elements.resultFooter.querySelector('button[print]')!;
  printButton.addEventListener('click', () => {
    const resultContentDiv: HTMLElement | null =
      document.querySelector('#result-content');
    if (resultContentDiv) {
      const jsPdf: jsPDF = new jsPDF('p', 'pt', 'letter');

      jsPdf.html(resultContentDiv, {
        callback: function (jsPdf: jsPDF) {
          jsPdf.save('result.pdf');
        },
        margin: [72, 72, 72, 72],
        autoPaging: 'text',
        html2canvas: {
          allowTaint: true,
          letterRendering: true,
          logging: false,
          scale: 0.8,
        },
      });
    }
  });
  elements.resultHeader.textContent = header;
  elements.resultContent.textContent = '';
  elements.resultContent.append(result);
  elements.result.removeAttribute('hidden');
  elements.resultContent.scrollTop = 0;
}

export function closeDialog(): void {
  elements.alert.setAttribute('hidden', 'true');
}

export function closeResults(): void {
  elements.result.setAttribute('hidden', 'true');
}
