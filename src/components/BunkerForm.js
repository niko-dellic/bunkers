import { useState } from "react";
import GenBunker from "./GenBunker";

export default function BunkerForm({ onFormDataChange, setResult }) {
  const [userData, setUserData] = useState(null);

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default form submission behavior
    const data = new FormData(e.target); // Create a FormData object from the form
    const formProps = Object.fromEntries(data); // Convert formData to a simple object
    const str = `${formProps.name} is the thing you always keep by your door/in your pantry/in your backpack for emergencies. You can only have one in your bunker. You choose ${formProps.item}. Your survival team is ${formProps.team}.`;

    setUserData({
      ...formProps,
      prompt: str,
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit} // Set the onSubmit handler
      >
        <h2 style={{ marginBottom: "20px" }}>
          Great pick. Give us a sense of your bunker
        </h2>{" "}
        {/* Added header */}
        <label style={{ marginBottom: "20px" }}>
          What is the thing you always keep by your door/in your pantry/in your
          backpack for emergencies
          <input type="text" name="name" />
        </label>
        <label style={{ marginBottom: "20px" }}>
          You can only have one in your bunker. What do you choose?
          <div>
            <input type="radio" id="item1" name="item" value="Spices" />
            <label for="item1"> Spices</label>
            <br />
            <input type="radio" id="item2" name="item" value="Soap" />
            <label for="item2"> Soap</label>
            <br />
            <input type="radio" id="item3" name="item" value="Music" />
            <label for="item3"> Music</label>
            <br />
            <input type="radio" id="item4" name="item" value="Monopolyt" />
            <label for="item3"> Monopoly</label>
            <br />
          </div>
        </label>
        <label>
          Whos on your survival team and why?
          <textarea name="team" style={{ resize: "none" }} />
        </label>
        <button type="submit">Submit</button>
      </form>
      <GenBunker
        userData={userData}
        setResult={setResult}
        onFormDataChange={onFormDataChange}
      />
      ;
    </>
  );
}
