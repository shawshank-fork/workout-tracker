function WorkoutCard({id, name, date, onDelete}) {
    return (
        <div>
            <h2>{name}</h2> 
            <p>{date}</p>

            <button onClick={() => onDelete(id)}>
                Delete
            </button>   
        </div>
        
    );
}
export default WorkoutCard;