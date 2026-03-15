import { useEffect, useState } from "react"
import { getProducts } from "../../services/api"
import { useParams } from "react-router-dom"

export default function Products() {

    const { id } = useParams()
    const [products, setProducts] = useState([])

    useEffect(() => {
        getProducts(id).then(setProducts)
    }, [])

    return (
        <div className="grid">

            {products.map(p => (
                <div className="card" key={p.id}>

                    <h3>{p.name}</h3>
                    <p>${p.price}</p>

                    <button>Add to cart</button>

                </div>
            ))}

        </div>
    )
}