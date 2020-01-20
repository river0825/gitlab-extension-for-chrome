export class MaterialAlert {
    static materialCallback: CallableFunction = null;
    private static materialModal: HTMLDivElement;
    private static materialModalCentered: HTMLDivElement;
    private static materialModalTitle: HTMLDivElement;
    private static materialModalContent: HTMLDivElement;
    private static materialModalText: HTMLDivElement;
    private static materialModalButtons: HTMLDivElement;
    private static materialModalButtonOK: HTMLDivElement;
    private static materialModalButtonCANCEL: HTMLDivElement;
    private static materialModalTitleText: HTMLDivElement;
    private static materialModalTitleClose: HTMLDivElement;


    static materialAlert(title: string, text: string, callback) {
        MaterialAlert.buildUp();
        MaterialAlert.materialModalTitleText.innerHTML = title;
        MaterialAlert.materialModalText.innerHTML = text;
        MaterialAlert.materialModalButtonCANCEL.style.display = 'none';
        MaterialAlert.materialModal.className = 'materialModal show';
        MaterialAlert.materialCallback = callback;
    }

    static materialConfirm(title, text, callback) {
        MaterialAlert.buildUp();
        MaterialAlert.materialAlert(title, text, callback);
        MaterialAlert.materialModalButtonCANCEL.style.display = 'block';
    }

    static closeMaterialAlert(event: Event) {
        event.stopPropagation()
        MaterialAlert.materialModal.className = 'materialModal hide';
        MaterialAlert.materialCallback();
    }

    protected static buildUp() {
        if (MaterialAlert.materialModal) return;

        console.log('material-modal.js v1.1.1')
        MaterialAlert.materialModal = document.createElement('div');
        MaterialAlert.materialModal.classList.add('materialModal');
        MaterialAlert.materialModal.className = 'materialModal hide';
        // MaterialAlert.materialModal.addEventListener("click", MaterialAlert.closeMaterialAlert);
        MaterialAlert.materialModalCentered = document.createElement('div');
        MaterialAlert.materialModalCentered.classList.add('materialModalCentered');
        MaterialAlert.materialModalContent = document.createElement('div');
        MaterialAlert.materialModalContent.classList.add('materialModalContent');
        MaterialAlert.materialModalContent.setAttribute('click', 'event.stopPropagation();');

        MaterialAlert.materialModalTitle = document.createElement('div');
        MaterialAlert.materialModalTitle.classList.add('materialModalTitle');
        MaterialAlert.materialModalTitleText = document.createElement('div');
        MaterialAlert.materialModalTitleClose = document.createElement('div');
        MaterialAlert.materialModalTitleClose.classList.add('materialModalTextClose');
        MaterialAlert.materialModalTitleClose.innerHTML = "X";
        MaterialAlert.materialModalTitleClose.addEventListener('click', MaterialAlert.closeMaterialAlert);
        MaterialAlert.materialModalTitle.appendChild(MaterialAlert.materialModalTitleText);
        MaterialAlert.materialModalTitle.appendChild(MaterialAlert.materialModalTitleClose);

        MaterialAlert.materialModalText = document.createElement('div');
        MaterialAlert.materialModalText.classList.add('materialModalText');
        MaterialAlert.materialModalButtons = document.createElement('div');
        MaterialAlert.materialModalButtons.classList.add('materialModalButtons');
        MaterialAlert.materialModalButtonOK = document.createElement('div');
        MaterialAlert.materialModalButtonOK.classList.add('materialModalButtonOK');
        MaterialAlert.materialModalButtonOK.className = 'materialModalButton'
        MaterialAlert.materialModalButtonOK.addEventListener('click', MaterialAlert.closeMaterialAlert);
        MaterialAlert.materialModalButtonOK.innerHTML = 'OK'
        MaterialAlert.materialModalButtonCANCEL = document.createElement('div');
        MaterialAlert.materialModalButtonCANCEL.classList.add('materialModalButtonCANCEL');
        MaterialAlert.materialModalButtonCANCEL.className = 'materialModalButton'
        MaterialAlert.materialModalButtonCANCEL.addEventListener('click', MaterialAlert.closeMaterialAlert);
        MaterialAlert.materialModalButtonCANCEL.innerHTML = 'CANCEL'
        MaterialAlert.materialModalButtons.appendChild(MaterialAlert.materialModalButtonOK);
        MaterialAlert.materialModalButtons.appendChild(MaterialAlert.materialModalButtonCANCEL);
        MaterialAlert.materialModalContent.appendChild(MaterialAlert.materialModalTitle)
        MaterialAlert.materialModalContent.appendChild(MaterialAlert.materialModalText)
        MaterialAlert.materialModalContent.appendChild(MaterialAlert.materialModalButtons)
        MaterialAlert.materialModalCentered.appendChild(MaterialAlert.materialModalContent)
        MaterialAlert.materialModal.appendChild(MaterialAlert.materialModalCentered);
        document.body.appendChild(MaterialAlert.materialModal)
    }
}
