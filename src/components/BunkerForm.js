export default function BunkerForm() {
  return (
    <form
      onClick={(e) => {
        e.stopPropagation();
        console.log("Form clicked");
      }}
    >
      <label>
        Name
        <input type="text" name="name" />
      </label>
      <label>
        Stockpile
        <input type="text" name="name" />
      </label>
      <label>
        How you spend your time
        <textarea
          name="fears"
          // disable resize
          style={{ resize: "none" }}
        />
      </label>
    </form>
  );
}
