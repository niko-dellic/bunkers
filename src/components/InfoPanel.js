export default function InfoPanel({minesweeperBunkers}) {

//const InfoPanel = () => {
  return (

    <div>
      <h2 style={{ marginBottom: '20px' }}>Welcome to BunkerTown, MA</h2>
            <p>Population: 
              {minesweeperBunkers.length}
            </p>
            <p>Top items stockpiled:</p>
            {/* TO DO - add gpt data looking at top items */}
      <h2 style={{ marginBottom: '20px' }}>Add your own bunker!</h2>
    </div>

    

      


  );
};

//export default InfoPanel;
