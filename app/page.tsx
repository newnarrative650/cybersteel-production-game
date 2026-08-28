"use client";
/* eslint-disable @next/next/no-img-element -- Local static photo; no image-service runtime is needed. */

import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { tubes, technologyText, type Tube, type Step } from "./production";
import { gameReducer, initialGame, shuffleSteps } from "./game";
import { publicAsset } from "./assets";

type Modal = { kind: "technology"; step: Step } | { kind: "rules" } | null;
type Drag = { id: string; pointerId: number; startX: number; startY: number; to: number | null; active: boolean };
type DragView = { id: string; x: number; y: number; to: number | null };

function OperationArt({ operation }: { operation: string }) {
  return <div className={`operation-art art-${operation}`} aria-hidden="true"><i /><i /><i /></div>;
}

export default function Home() {
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const [modal, setModal] = useState<Modal>(null);
  const [dragView, setDragView] = useState<DragView | null>(null);
  const drag = useRef<Drag | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cardButtons = useRef(new Map<string, HTMLButtonElement>());
  const tube = game.tube;
  const solved = game.evaluation?.complete ?? false;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (modal && !node.open) node.showModal();
    if (!modal && node.open) node.close();
    if (!modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [modal]);

  function clearDrag() { drag.current = null; setDragView(null); }
  function start(tube: Tube) {
    clearDrag();
    dispatch({ type: "start", tube, order: shuffleSteps(tube.steps) });
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function leave() {
    clearDrag(); setModal(null); dispatch({ type: "leave" });
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function restart() {
    if (!tube) return;
    clearDrag(); dispatch({ type: "restart", order: shuffleSteps(tube.steps) });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function beginDrag(event: PointerEvent<HTMLButtonElement>, step: Step) {
    if (solved || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatch({ type: "cancel-selection" });
    drag.current = { id: step.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, to: null, active: false };
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (!active.active && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 7) return;
    active.active = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-card-index]");
    const index = target ? Number(target.dataset.cardIndex) : null;
    active.to = index !== null && index > 0 ? index : null;
    setDragView({ id: active.id, x: event.clientX, y: event.clientY, to: active.to });
    if (event.clientY < 85) window.scrollBy(0, -14);
    else if (event.clientY > window.innerHeight - 85) window.scrollBy(0, 14);
  }
  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (active?.pointerId !== event.pointerId) return;
    if (active.active && active.to !== null) dispatch({ type: "move", id: active.id, to: active.to });
    clearDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboardMove(event: KeyboardEvent<HTMLButtonElement>, step: Step, index: number) {
    if (event.key === "Escape") { clearDrag(); dispatch({ type: "cancel-selection" }); return; }
    const destination = event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1
      : event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1
      : event.key === "Home" ? 1 : event.key === "End" ? game.cards.length - 1 : null;
    if (destination === null || solved) return;
    event.preventDefault();
    dispatch({ type: "move", id: step.id, to: destination });
    requestAnimationFrame(() => cardButtons.current.get(step.id)?.focus());
  }
  const selectedTitle = game.cards.find(step => step.id === game.selectedId)?.title;
  const draggedTitle = game.cards.find(step => step.id === dragView?.id)?.title;
  const statusText = solved ? "Все 10 этапов на своих местах. Цепочка собрана!"
    : game.evaluation ? `На своих местах ${game.evaluation.correct} из 10 этапов. Попробуй ещё.`
    : selectedTitle ? `Выбрано: ${selectedTitle}. Нажми другую карточку, чтобы поменять их местами.`
    : game.moves ? `Перестановок: ${game.moves}. Проверь порядок, когда будешь готов.`
    : "Первый этап закреплён. Остальные карточки перемешаны.";

  return <div className={`site-shell ${tube ? "is-playing" : ""}`}>
    <header className="site-header">
      <button className="wordmark" onClick={leave} aria-label="CYBERSTEEL — выбор трубы"><span className="brand-mark" />CYBERSTEEL</button>
      <span className="header-caption">ТЕХНОЛОГИЯ В ТВОИХ РУКАХ</span>
      <button className="rules-button" onClick={() => setModal({ kind: "rules" })}><span>?</span>Как играть</button>
      <span className="version"><i />MVP 01</span>
    </header>
    <main>{!tube ? <>
      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow"><span />ОТ ЗАГОТОВКИ ДО ГОТОВОЙ ТРУБЫ</p>
          <h1 ref={heading} tabIndex={-1}>Собери<br /><em>технологию.</em></h1>
          <p className="intro-description">У каждой трубы — свой путь.<br />Выбери производство и расставь его этапы<br className="desktop-break" /> в правильном порядке.</p>
          <div className="intro-meta"><span>3 типа труб</span><span>11 этапов</span><span>Подсказки на карточках</span></div>
        </div>
        <div className="hero-visual"><img src={publicAsset("tubes.webp")} alt="Торцы бесшовных стальных труб CYBERSTEEL" width={1230} height={800} fetchPriority="high" /><span className="visual-cross">+</span><div className="visual-caption"><span>CYBERSTEEL / ПРОИЗВОДСТВО</span><span>БЕСШОВНАЯ ТОЧНОСТЬ</span></div></div>
      </section>
      <section className="selection-section" aria-labelledby="selection-title">
        <div className="section-heading"><h2 id="selection-title">Какую трубу соберём?</h2><span>ВЫБЕРИ ТЕХНОЛОГИЧЕСКИЙ МАРШРУТ ↓</span></div>
        <div className="tube-options">{tubes.map((option, index) => <button key={option.id} className={`tube-option tube-${option.id}`} onClick={() => start(option)}>
          <div className="option-top"><span>0{index + 1} / {option.industry}</span><span>11 ЭТАПОВ</span></div>
          <div className={`pipe-art pipes-${option.id}`} aria-hidden="true">{[0, 1, 2].map(i => <i key={i} />)}<span className="art-cross">+</span></div>
          <h3>{option.title}</h3><p>{option.description}</p><div className="option-bottom"><span>Собрать цепочку</span><span className="round-arrow">↗</span></div>
        </button>)}</div>
      </section>
    </> : <section className="game-section">
      <div className="game-topline"><button className="back-button" onClick={leave}>← Выбор трубы</button><span>{tube.industry} / МАРШРУТ 0{tubes.findIndex(option => option.id === tube.id) + 1}</span></div>
      <div className="game-heading">
        <div><p className="eyebrow"><span />СОБЕРИ ПРОИЗВОДСТВЕННУЮ ЦЕПОЧКУ</p><h1 ref={heading} tabIndex={-1} className="game-title">{tube.title}</h1></div>
        <div className="route-counter"><strong>01<span>/11</span></strong><span>ПЕРВЫЙ ЭТАП УЖЕ НА МЕСТЕ</span></div>
      </div>
      <div className="board-instructions"><p>Перетащи карточки за <span className="inline-grip">⠿</span> или нажми на две, чтобы поменять их местами.</p><span><b>?</b> — об этапе</span></div>
      {game.evaluation && <div role="status" className={`feedback-banner ${solved ? "feedback-success" : "feedback-retry"}`}>
        <span className="feedback-symbol">{solved ? "✓" : "↔"}</span>
        <div><strong>{solved ? "Технология собрана." : `На своих местах: ${game.evaluation.correct} из 10`}</strong><p>{solved ? "Все этапы в правильном порядке. Можно собрать другую трубу." : "Зелёные карточки стоят верно. Переставь отмеченные — и проверь ещё раз."}</p></div>
        {solved && <span className="success-score">10 / 10</span>}
      </div>}
      <ol className="cards-grid" aria-label="Последовательность производственных этапов">
        {game.cards.map((step, index) => {
          const fixed = index === 0;
          const correct = game.evaluation?.positions[index];
          const selected = game.selectedId === step.id;
          const classes = ["step-card", fixed ? "is-locked" : "", selected ? "is-selected" : "", correct === true && !fixed ? "is-correct" : "", correct === false ? "is-incorrect" : "", dragView?.id === step.id ? "is-dragging" : "", dragView?.to === index ? "is-drop-target" : ""].filter(Boolean).join(" ");
          return <li key={`${tube.id}-${step.id}`} className={classes} data-card-index={index} data-card-id={step.id}>
            <div className="card-top">
              <span className="position-number" aria-label={`Позиция ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
              <span className="card-tools">
                {!fixed && <button type="button" className="drag-handle" disabled={solved} aria-label={`Переместить: ${step.title}`} title="Перетащи или используй стрелки клавиатуры" onPointerDown={event => beginDrag(event, step)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={clearDrag} onLostPointerCapture={clearDrag} onKeyDown={event => keyboardMove(event, step, index)}>⠿</button>}
                <button className="help-button" aria-label={`Об этапе: ${step.title}`} onClick={() => setModal({ kind: "technology", step })}>?</button>
              </span>
            </div>
            {fixed ? <div className="card-main fixed-content"><OperationArt operation={step.operation} /><span className="card-title">{step.title}</span></div>
              : <button className="card-main" ref={node => { if (node) cardButtons.current.set(step.id, node); else cardButtons.current.delete(step.id); }} disabled={solved} aria-pressed={selected} aria-label={`Позиция ${index + 1}: ${step.title}. Выбрать для перестановки`} onClick={() => dispatch({ type: "choose", id: step.id })} onKeyDown={event => keyboardMove(event, step, index)}><OperationArt operation={step.operation} /><span className="card-title">{step.title}</span></button>}
            <div className="card-status">{fixed ? <><span>✓</span> НАЧАЛО · ЗАКРЕПЛЕНО</> : correct === true ? <><span>✓</span> НА СВОЁМ МЕСТЕ</> : correct === false ? <><span>↔</span> НУЖНО ПЕРЕСТАВИТЬ</> : selected ? <><span>↔</span> ВЫБЕРИ ВТОРУЮ</> : <><span>↔</span> МОЖНО ПЕРЕМЕЩАТЬ</>}</div>
          </li>;
        })}
        <li className="board-note"><span className="note-symbol">↻</span><h2>Повторы —<br />часть процесса.</h2><p>Одинаковые карточки взаимозаменяемы. Важен порядок операций.</p><span>СЛЕВА НАПРАВО →<br />ЗАТЕМ СЛЕДУЮЩИЙ РЯД ↓</span></li>
      </ol>
      <div className="game-controls">
        <div className="control-copy">{solved ? <strong>От заготовки — к готовой трубе.</strong> : selectedTitle ? <strong>Теперь выбери вторую карточку.</strong> : <strong>Всё на своих местах?</strong>}<span>ПЕРЕСТАНОВОК: {game.moves}<i />ПРОВЕРОК: {game.attempts}</span></div>
        <div className="control-buttons"><button className="secondary-button" onClick={restart}><span>↻</span>{solved ? "Собрать ещё раз" : "Перемешать"}</button>{solved ? <button className="primary-button" onClick={leave}>Другая труба<span>↗</span></button> : <button className="primary-button" disabled={game.evaluation !== null} onClick={() => { clearDrag(); dispatch({ type: "check" }); }}>Проверить порядок<span>→</span></button>}</div>
      </div>
      <p className="route-footnote">Сокращённая учебная схема. Дополнительные проходы циклов не развёрнуты.</p>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{statusText}</span>
    </section>}</main>
    <footer className="site-footer"><span>CYBERSTEEL · ТЕХНОЛОГИИ ПРОИЗВОДСТВА</span><span>УЧЕБНАЯ ИГРА / MVP 01</span></footer>
    {dragView && <div className="drag-ghost" style={{ left: dragView.x + 16, top: dragView.y + 14 }} aria-hidden="true"><span>⠿</span>{draggedTitle}</div>}
    <dialog ref={dialog} className="site-dialog" aria-labelledby="dialog-title" onCancel={() => setModal(null)} onClose={() => setModal(null)} onClick={event => { if (event.target === event.currentTarget) setModal(null); }}>
      <div className="dialog-inner">
        <button className="dialog-close" aria-label="Закрыть окно" onClick={() => setModal(null)}>×</button>
        {modal?.kind === "technology" ? <>
          <p className="eyebrow"><span />ОБ ЭТАПЕ ПРОИЗВОДСТВА</p>
          <OperationArt operation={modal.step.operation} />
          <h2 id="dialog-title">{modal.step.title}</h2>
          <p className="technology-description">{technologyText(modal.step.title)}</p>
          <span className="placeholder-note">ДЕМОНСТРАЦИОННЫЙ ТЕКСТ ДЛЯ MVP</span>
        </> : <>
          <p className="eyebrow"><span />ПРАВИЛА ИГРЫ</p>
          <h2 id="dialog-title">У каждой операции<br />своё место.</h2>
          <ol className="rules-list"><li><b>01</b><p>Выбери трубу. Заготовка уже стоит первой и не перемещается.</p></li><li><b>02</b><p>Расставь остальные 10 карточек. Перетаскивай за ⠿ или нажми две карточки по очереди, чтобы поменять их местами.</p></li><li><b>03</b><p>Нажимай «?» на любой карточке, чтобы прочитать об этапе. Затем проверь порядок и исправь отмеченные позиции.</p></li></ol>
          <p className="keyboard-hint">С клавиатуры: Tab — выбрать карточку, Enter — выделить, стрелки — переместить на одну позицию, Esc — отменить выделение или закрыть окно.</p>
          <p className="keyboard-hint">Одинаковые операции взаимозаменяемы. В игре используются сокращённые схемы без разворачивания повторных циклов.</p>
          <div className="source-links"><span>СХЕМЫ CYBERSTEEL</span>{tubes.map(option => <a key={option.id} href={option.source} target="_blank" rel="noopener noreferrer">{option.title} ↗</a>)}</div>
        </>}
        <button className="primary-button dialog-done" onClick={() => setModal(null)}>Понятно<span>↗</span></button>
      </div>
    </dialog>
  </div>;
}
