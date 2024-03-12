export default function BunkerForm({ onFormDataChange }) {
  // Function to handle form submission
  const handleSubmit = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default form submission behavior
    const data = new FormData(e.target); // Create a FormData object from the form
    const formProps = Object.fromEntries(data); // Convert formData to a simple object
    onFormDataChange(formProps); // Pass the form data object back to the parent component
  };

  return (
    <form
      onSubmit={handleSubmit} // Set the onSubmit handler
    >
      <label>
        Name
        <input type="text" name="name" />
      </label>
      <label>
        Stockpile
        <input type="text" name="stockpile" />{" "}
        {/* Corrected the name attribute */}
      </label>
      <label>
        How you spend your time
        <textarea name="fears" style={{ resize: "none" }} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
