import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------
// DATOS DEL JUEGO
// ---------------------------------------------
const CATEGORIES = {
  'aumento-demanda': { label: 'Aumento Demanda', short: 'Demanda ↑', accent: 'pink' },
  'descenso-demanda': { label: 'Descenso Demanda', short: 'Demanda ↓', accent: 'teal' },
  'aumento-oferta': { label: 'Aumento Oferta', short: 'Oferta ↑', accent: 'yellow' },
  'descenso-oferta': { label: 'Descenso Oferta', short: 'Oferta ↓', accent: 'purple' },
};

const DOMINOES = [
  { id: 1, category: 'aumento-demanda', cause: 'Baja el precio del bien' },
  { id: 2, category: 'aumento-demanda', cause: 'Sube el precio de un bien sustitutivo' },
  { id: 3, category: 'aumento-demanda', cause: 'Aumenta la renta (bien normal)' },
  { id: 4, category: 'descenso-demanda', cause: 'Sube el precio del bien' },
  { id: 5, category: 'descenso-demanda', cause: 'Baja el precio de un bien sustitutivo' },
  { id: 6, category: 'descenso-demanda', cause: 'Bajan las preferencias del consumidor' },
  { id: 7, category: 'aumento-oferta', cause: 'Mejora la tecnología' },
  { id: 8, category: 'aumento-oferta', cause: 'Aumenta el número de productores' },
  { id: 9, category: 'aumento-oferta', cause: 'Baja el precio de los factores productivos' },
  { id: 10, category: 'descenso-oferta', cause: 'Empeora la tecnología' },
  { id: 11, category: 'descenso-oferta', cause: 'Sube el precio de los factores productivos' },
  { id: 12, category: 'descenso-oferta', cause: 'Disminuye el número de productores' },
];

const TUTORIAL_STEPS = [
  {
    title: '¿Qué es el Dominó de Mercado?',
    text: 'Cada ficha tiene una causa económica, por ejemplo "sube el precio de un bien sustitutivo". Tu misión es reconocer qué efecto provoca esa causa: ¿sube o baja la demanda? ¿Sube o baja la oferta?',
  },
  {
    title: 'El tablero',
    text: 'Vas a ver 4 zonas: Aumento Demanda, Descenso Demanda, Aumento Oferta y Descenso Oferta. Cada ficha de tu mano pertenece a una sola zona.',
  },
  {
    title: 'Cómo jugar',
    text: 'Toca una ficha de tu mano para seleccionarla y luego toca la zona donde crees que encaja. Si aciertas, la ficha cae en su lugar como en un dominó real. Si fallas, vuelve a tu mano y sigue el turno del siguiente grupo.',
  },
  {
    title: 'Cómo se gana',
    text: 'En modo grupos: gana el primer equipo en quedarse sin fichas en la mano. En modo un jugador: tu meta es colocar las 12 fichas en el menor tiempo posible y con los menos errores.',
  },
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ---------------------------------------------
// COMPONENTES PEQUEÑOS
// ---------------------------------------------
function Pips() {
  return (
    <div className="pips">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="pip" />
      ))}
    </div>
  );
}

function DominoCard({ cause, category, selected, placed, onClick }) {
  const accent = CATEGORIES[category]?.accent;
  return (
    <button
      className={`domino-card accent-${accent} ${selected ? 'is-selected' : ''} ${placed ? 'is-placed' : ''}`}
      onClick={onClick}
      disabled={placed}
    >
      <Pips />
      <span className="domino-cause">{cause}</span>
    </button>
  );
}

function CategorySlot({ catKey, count, isTarget, feedback, onClick }) {
  const cat = CATEGORIES[catKey];
  return (
    <button
      className={`slot accent-${cat.accent} ${feedback === 'correct-' + catKey ? 'slot-correct' : ''} ${feedback === 'wrong-' + catKey ? 'slot-wrong' : ''}`}
      onClick={onClick}
    >
      <span className="slot-label">{cat.label}</span>
      <span className="slot-count">{count} ficha{count === 1 ? '' : 's'}</span>
    </button>
  );
}

// ---------------------------------------------
// APP
// ---------------------------------------------
export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [mode, setMode] = useState(null); // 'teams' | 'solo'
  const [numTeams, setNumTeams] = useState(2);

  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(0);
  const [soloHand, setSoloHand] = useState([]);
  const [board, setBoard] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [winner, setWinner] = useState(null);
  const timerRef = useRef(null);

  // Timer para modo solo
  useEffect(() => {
    if (screen === 'game' && mode === 'solo') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [screen, mode]);

  const emptyBoard = () =>
    Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, []]));

  const startTeams = () => {
    const deck = shuffle(DOMINOES);
    const hands = Array.from({ length: numTeams }, () => []);
    deck.forEach((card, i) => hands[i % numTeams].push(card));
    setTeams(hands.map((hand, i) => ({ name: `Equipo ${i + 1}`, hand })));
    setActiveTeam(0);
    setBoard(emptyBoard());
    setSelectedCard(null);
    setWinner(null);
    setScreen('game');
  };

  const startSolo = () => {
    setSoloHand(shuffle(DOMINOES));
    setBoard(emptyBoard());
    setSelectedCard(null);
    setMistakes(0);
    setSeconds(0);
    setWinner(null);
    setScreen('game');
  };

  const currentHand = mode === 'solo' ? soloHand : teams[activeTeam]?.hand ?? [];

  const attemptPlace = (catKey) => {
    if (!selectedCard || feedback) return;
    const card = currentHand.find((c) => c.id === selectedCard);
    if (!card) return;
    const correct = card.category === catKey;

    setFeedback(correct ? `correct-${catKey}` : `wrong-${catKey}`);

    setTimeout(() => {
      if (correct) {
        setBoard((b) => ({ ...b, [catKey]: [...b[catKey], card] }));

        if (mode === 'solo') {
          const nextHand = soloHand.filter((c) => c.id !== card.id);
          setSoloHand(nextHand);
          if (nextHand.length === 0) {
            clearInterval(timerRef.current);
            setWinner('solo');
            setScreen('results');
          }
        } else {
          const nextTeams = teams.map((t, i) =>
            i === activeTeam ? { ...t, hand: t.hand.filter((c) => c.id !== card.id) } : t
          );
          setTeams(nextTeams);
          if (nextTeams[activeTeam].hand.length === 0) {
            setWinner(nextTeams[activeTeam].name);
            setScreen('results');
          } else {
            setActiveTeam((activeTeam + 1) % numTeams);
          }
        }
      } else {
        if (mode === 'solo') setMistakes((m) => m + 1);
        else setActiveTeam((activeTeam + 1) % numTeams);
      }
      setSelectedCard(null);
      setFeedback(null);
    }, 700);
  };

  const restart = () => {
    setScreen('mode');
    setMode(null);
  };

  // ---------------------------------------------
  // PANTALLAS
  // ---------------------------------------------
  if (screen === 'welcome') {
    return (
      <div className="screen screen-welcome">
        <div className="domino-hero">
          <Pips /><Pips /><Pips />
        </div>
        <h1 className="brand-title">Dominó de Mercado</h1>
        <p className="brand-subtitle">
          Descubre cómo se mueve la oferta y la demanda, ficha por ficha.
        </p>
        <button className="btn btn-primary" onClick={() => setScreen('tutorial')}>
          Empezar
        </button>
        <div className="credits">
          <p>Juego original de <strong>Econosublime</strong> — @Economarina · @Economyriam · @Econosublime</p>
          <p>Versión digital hecha posible por <strong>FundEdu</strong></p>
        </div>
      </div>
    );
  }

  if (screen === 'tutorial') {
    const step = TUTORIAL_STEPS[tutorialStep];
    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
    return (
      <div className="screen screen-tutorial">
        <div className="tutorial-card">
          <div className="dots">
            {TUTORIAL_STEPS.map((_, i) => (
              <span key={i} className={`dot ${i === tutorialStep ? 'dot-active' : ''}`} />
            ))}
          </div>
          <h2>{step.title}</h2>
          <p>{step.text}</p>
          <div className="tutorial-nav">
            <button
              className="btn btn-ghost"
              disabled={tutorialStep === 0}
              onClick={() => setTutorialStep((s) => s - 1)}
            >
              Anterior
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                isLast ? setScreen('mode') : setTutorialStep((s) => s + 1)
              }
            >
              {isLast ? 'Elegir modo de juego' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'mode') {
    return (
      <div className="screen screen-mode">
        <h2>¿Cómo quieres jugar?</h2>
        <div className="mode-options">
          <button className="mode-card accent-pink" onClick={() => { setMode('teams'); setScreen('setup'); }}>
            <span className="mode-emoji">👥</span>
            <span className="mode-title">Pase y juega</span>
            <span className="mode-desc">Un dispositivo, grupos por turnos</span>
          </button>
          <button className="mode-card accent-teal" onClick={() => { setMode('solo'); startSolo(); }}>
            <span className="mode-emoji">🧠</span>
            <span className="mode-title">Un jugador vs Banco</span>
            <span className="mode-desc">Contrarreloj, tú solo</span>
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="screen screen-setup">
        <h2>¿Cuántos equipos?</h2>
        <div className="team-picker">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={`btn btn-pill ${numTeams === n ? 'btn-pill-active' : ''}`}
              onClick={() => setNumTeams(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={startTeams}>
          Repartir fichas
        </button>
      </div>
    );
  }

  if (screen === 'game') {
    return (
      <div className="screen screen-game">
        <header className="game-header">
          {mode === 'teams' ? (
            <span className="turn-badge">Turno de {teams[activeTeam]?.name}</span>
          ) : (
            <span className="turn-badge">⏱ {seconds}s · Errores: {mistakes}</span>
          )}
        </header>

        <div className="board">
          {Object.keys(CATEGORIES).map((catKey) => (
            <CategorySlot
              key={catKey}
              catKey={catKey}
              count={board[catKey]?.length ?? 0}
              feedback={feedback}
              onClick={() => attemptPlace(catKey)}
            />
          ))}
        </div>

        {feedback && (
          <p className={`feedback-msg ${feedback.startsWith('correct') ? 'is-correct' : 'is-wrong'}`}>
            {feedback.startsWith('correct') ? '¡Correcto! La ficha cae en su lugar.' : 'Esa no es la zona correcta, prueba otra vez.'}
          </p>
        )}

        <div className="hand">
          <p className="hand-label">
            {mode === 'teams' ? `Mano de ${teams[activeTeam]?.name}` : 'Tu mano'}
          </p>
          <div className="hand-cards">
            {currentHand.map((card) => (
              <DominoCard
                key={card.id}
                cause={card.cause}
                category={card.category}
                selected={selectedCard === card.id}
                onClick={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'results') {
    return (
      <div className="screen screen-results">
        <h1 className="brand-title">¡Dominó completo!</h1>
        {mode === 'solo' ? (
          <p className="results-copy">
            Colocaste las 12 fichas en <strong>{seconds}s</strong> con <strong>{mistakes}</strong> error{mistakes === 1 ? '' : 'es'}.
          </p>
        ) : (
          <p className="results-copy"><strong>{winner}</strong> se quedó sin fichas primero. ¡Felicidades!</p>
        )}
        <button className="btn btn-primary" onClick={restart}>
          Jugar otra vez
        </button>
        <div className="credits">
          <p>Juego original de <strong>Econosublime</strong> · Versión digital por <strong>FundEdu</strong></p>
        </div>
      </div>
    );
  }

  return null;
}