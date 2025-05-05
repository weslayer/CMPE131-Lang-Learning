import styles from "./add-modal.module.css"
import { DeckID } from "@/types/deck";
import Modal from "react-modal";

interface FlashcardAddModalArgs {
    deckID: DeckID;
    closeModal: ()=>void;
};

export default function FlashcardAddModal({
    closeModal
} : FlashcardAddModalArgs) {
    Modal.setAppElement("body");

    return <Modal
        isOpen
        className={styles["content"]}

        overlayClassName={styles["overlay"]}
        onRequestClose={closeModal}
    >

    </Modal>
}