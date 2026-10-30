import { Modal } from "../ui";

export function Confirm({ title, text, action, danger, onClose, onOk }) {
  return (
    <Modal title={title} onClose={onClose} width={440}>
      <p className="muted" style={{ marginTop: 0 }}>
        {text}
      </p>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button className={"btn " + (danger ? "btn-danger-solid" : "btn-primary")} onClick={onOk}>
          {action}
        </button>
      </div>
    </Modal>
  );
}
