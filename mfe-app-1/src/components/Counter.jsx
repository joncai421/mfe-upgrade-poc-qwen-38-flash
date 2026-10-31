import { connect } from "react-redux";
import { increment, decrement, setStep, reset } from "../redux/actions";

function Counter({ value, step, increment, decrement, setStep, reset }) {
  return (
    <div className="border border-gray-200 rounded p-4" data-testid="counter">
      <h4 className="app-subheading">Redux Counter</h4>
      <p className="text-3xl font-bold text-indigo-600 mb-4" data-testid="counter-value">
        {value}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn-primary" onClick={increment} data-testid="increment-btn">
          + Increment
        </button>
        <button className="btn-secondary" onClick={decrement} data-testid="decrement-btn">
          - Decrement
        </button>
        <button className="btn-secondary" onClick={reset} data-testid="reset-btn">
          Reset
        </button>
        <label className="ml-2 text-sm text-gray-600 flex items-center">
          Step
          <input
            type="number"
            min="1"
            value={step}
            onChange={(e) => setStep(e.target.value)}
            className="form-input w-20 ml-2"
            data-testid="step-input"
          />
        </label>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  value: state.counter.value,
  step: state.counter.step,
});

const mapDispatchToProps = { increment, decrement, setStep, reset };

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
