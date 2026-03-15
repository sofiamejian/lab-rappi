import { useEffect, useState } from "react"
import { getStores } from "../../services/api"

export default function Stores() {

    const [stores, setStores] = useState([])

    useEffect(() => {

        getStores().then(setStores)

    }, [])

    return (

        <div className="grid">

            {stores.map(store => (

                <div className="card" key={store.id}>

                    <h3>{store.name}</h3>

                    <button>View products</button>

                </div>

            ))}

        </div>

    )

}