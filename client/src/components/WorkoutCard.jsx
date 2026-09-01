function WorkoutCard({id, name, date, onDelete, onSelect}) {
    return (
        <div>
            <h2>{name}</h2> 
            <p>{date}</p>

            <button onClick={() => onSelect({id, name, date})}>
                View Exercises
            </button>
            
            <button onClick={() => onDelete(id)}>
                Delete
            </button>   
        </div>
        
    );
}
export default WorkoutCard;