import { connect } from "react-redux";

function DetailsPage({ value, step }) {
  return (
    <div data-testid="app1-details">
      <h4 className="app-subheading">Details (shares the same Redux store)</h4>
      <p className="text-sm text-gray-600 mb-2">
        This route reads counter state from the store to prove routing and Redux
        work together inside the remote.
      </p>
      <ul className="text-sm space-y-1">
        <li data-testid="details-value">Current count: {value}</li>
        <li data-testid="details-step">Current step: {step}</li>
      </ul>
    </div>
  );
}

const mapStateToProps = (state) => ({
  value: state.counter.value,
  step: state.counter.step,
});

export default connect(mapStateToProps)(DetailsPage);
