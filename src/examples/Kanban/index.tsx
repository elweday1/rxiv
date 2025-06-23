//==================================================================
//  TYPES & INITIAL STATE
//==================================================================

import { control, Each, multiControl, on, store } from "../../framework";
import { map, merge, takeUntil, withLatestFrom } from "rxjs";

interface Card {
    id: string;
    text: string;
    columnId: string;
}

interface Column {
    id: string;
    title: string;
    cardIds: string[];
}

interface DraggedItem {
    cardId: string;
    sourceColumnId: string
}

interface BoardState {
    columns: { [key: string]: Column };
    columnOrder: string[];
    cards: { [key: string]: Card };
    draggedItem: DraggedItem | null
}

const initialState: BoardState = {
    draggedItem: null,
    cards: {
        'card-1': { id: 'card-1', text: 'Design the API', columnId: "col-1" },
        'card-2': { id: 'card-2', text: 'Implement the renderer', columnId: "col-1" },
        'card-3': { id: 'card-3', text: 'Write documentation', columnId: "col-2" },
    },
    columns: {
        'col-1': { id: 'col-1', title: 'To Do', cardIds: ['card-1', 'card-2'] },
        'col-2': { id: 'col-2', title: 'In Progress', cardIds: ['card-3'] },
        'col-3': { id: 'col-3', title: 'Done', cardIds: [] },
    },
    columnOrder: ['col-1', 'col-2', 'col-3'],
};

const cardControls = multiControl(() => control({
    events: ["dragstart", "dragend"]
}))

const columnControls = multiControl(() => control({
    events: ["dragover", "dragleave", "drop"]
}));

const newCardFormControls = multiControl(() => control({
    events: ["submit"]
}));

const boardStore = store(
    initialState, {},
    on(cardControls.events.dragstart$, ({ cards }, { event, key }) => {
        (event.target as HTMLElement).classList.add('dragging');
        return {
            draggedItem: { cardId: key, sourceColumnId: cards[key].columnId }
        }
    }),
    on(cardControls.events.dragend$, (_, { event }) => {
        event.preventDefault();
        (event.target as HTMLElement).classList.remove('dragging');
        return { draggedItem: null }
    }),
    on(merge(
        columnControls.events.dragover$,
        columnControls.events.dragleave$
    ), (_, { event }) => {
        event.preventDefault(); // Allow drop
        (event.currentTarget as HTMLElement).classList.add('drag-over');
    }),
    on(columnControls.events.drop$, (currentState, { event, key }) => {
        event.preventDefault();
        (event.currentTarget as HTMLElement).classList.remove('drag-over');

        const draggedCardId = currentState.draggedItem?.cardId as string;
        const sourceColumnId = currentState.draggedItem?.sourceColumnId as string;
        if (!(currentState.draggedItem && currentState.draggedItem.sourceColumnId !== key)) {
            return;
        }
        const cards = { ...currentState.cards };
        const card = { ...cards[draggedCardId], columnId: key }
        cards[draggedCardId] = card

        const sourceCol = { ...currentState.columns[sourceColumnId] };
        sourceCol.cardIds = sourceCol.cardIds.filter(id => id !== draggedCardId);
        const destCol = { ...currentState.columns[key] };
        destCol.cardIds = [...destCol.cardIds, draggedCardId];
        return ({
            cards,
            columns: {
                ...currentState.columns,
                [sourceColumnId]: sourceCol,
                [key]: destCol,
            },
        });
    }),
    on(newCardFormControls.events.submit$, (currentState, {event, key})=>{
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        const text = data.get("cardTitle")?.toString()!;
        const newCardId = `card-${Date.now()}`;
        const newCard: Card = { id: newCardId, text, columnId: key };
        const targetCol = { ...currentState.columns[key] };
        targetCol.cardIds = [...targetCol.cardIds, newCardId];

        return {
            cards: {
                ...currentState.cards,
                [newCardId]: newCard,
            },
            columns: {
                ...currentState.columns,
                [key]: targetCol,
            },
        };
    },
))

const board$ = boardStore.context.columnOrder$.pipe(
    withLatestFrom(boardStore.context.columns$, boardStore.context.cards$),
    map(([columnOrder, columns, cards]) => {
        return columnOrder.map(id => ({
             ...columns[id], cards: columns[id].cardIds.map(id => cards[id]) 
        })
    )}),
)

export const KanbdanBoard = () => {
    return (
        <div class="board">
            <Each items$={board$} keyFn={({id}) => id}>
                {(column) => {
                    return <div class="column">
                        <div class="column-header">{column.title}</div>
                        <div
                            class="card-list"
                            control={columnControls.at(column.id)}
                        >
                            {column.cards.map((card) => <div
                                class="card"
                                control={cardControls.at(card.id)}
                                draggable={true}
                            >
                                {card.text}
                            </div>
                            )}
                        </div>
                        <form control={newCardFormControls.at(column.id)} class="add-card-form">
                        <input name="cardTitle" type="text" placeholder="Add a card..." />
                    </form>
                    </div>;
                }}
            </Each>
        </div>
    );
};
