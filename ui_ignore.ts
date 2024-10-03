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

export function showResult(
  capturedId: SDCId.CapturedId,
  verificationResult: any
): void {
  const result = document.createDocumentFragment();

  // Scanned document result modal Header
  const header = 'Verification Result';
  console.log({ capturedId, verificationResult });
}

export function closeDialog(): void {
  elements.alert.setAttribute('hidden', 'true');
}

export function closeResults(): void {
  elements.result.setAttribute('hidden', 'true');
}
