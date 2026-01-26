import React, {useEffect, useState} from 'react'
import { supabase } from "../lib/supabase";
import {Plus, Pencil, Trash} from "lucide-react";
import NoImage from '../assets/no_image.jpg'


export default function Test() {
  const [todos, setTodos] = useState([])
  const [products, setProducts] = useState([])
  // const [title, setTitle] = useState('')
  // const [editingId, setEditingId] = useState(null)

  // READ
  // const fetchTodos = async () => {
  //   const { data, error } = await supabase
  //     .from('todos')
  //     .select('*')
  //     .order('id', { ascending: true })

  //   if (!error) setTodos(data)
  // }

  // useEffect(() => {
  //   fetchTodos()

  //   // REALTIME SUBSCRIPTION
  //   const channel = supabase
  //     .channel('todos-realtime')
  //     .on(
  //       'postgres_changes',
  //       { event: '*', schema: 'public', table: 'todos' },
  //       () => {
  //         fetchTodos()
  //       }
  //     )
  //     .subscribe()

  //   // CLEANUP
  //   return () => {
  //     supabase.removeChannel(channel)
  //   }
  // }, [])

  //products fetch

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })

    if (!error) setProducts(data)
  }

  const getImageUrl = (path) => {
    if (!path) return NoImage;
    if (path.startsWith('http')) return path; // In case you saved full URLs
    
    const { data } = supabase.storage
      .from('product-images') 
      .getPublicUrl(path);
      
    return data.publicUrl;
  };

  useEffect(() => {
    fetchProducts()

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('todos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    // CLEANUP
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // CREATE
  // const addTodo = async () => {
  //   if (!title) return
  //   await supabase.from('todos').insert({ title })
  //   setTitle('')
  // }

  // UPDATE
  // const updateTodo = async (id) => {
  //   await supabase
  //     .from('todos')
  //     .update({ title })
  //     .eq('id', id)

  //   setEditingId(null)
  //   setTitle('')
  // }

  // DELETE
  // const deleteTodo = async (id) => {
  //   await supabase
  //     .from('todos')
  //     .delete()
  //     .eq('id', id)
  // }

  return (
    <div style={{ padding: 20 }}>
      <h2 className = "text-xl mb-3">Realtime Supabase CRUD</h2>

      {/* <div className = "flex items-center">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Todo title"
          className = "border border-slate-500 p-2 rounded-md focus-outline-none"
        />

        {editingId ? (
          <button className = "flex items-center justify-center px-2 py-1 text-sm text-white bg-emerald-500 rounded-sm ml-3" onClick={() => updateTodo(editingId)}><Pencil className = "w-4 h-4"/>Update</button>
        ) : (
          <button className = "flex items-center justify-center px-4 py-1 text-sm text-white bg-emerald-500 rounded-sm ml-3" onClick={addTodo}><Plus className = "w-4 h-4"/>Add</button>
        )}
      </div> */}

      {/* <ul className = "mt-3 space-y-4">
        {todos.map((todo) => (
          <li key={todo.id} className = "flex gap-3">
            {todo.title}

            <button
              onClick={() => {
                setEditingId(todo.id)
                setTitle(todo.title)
              }}

              className = "px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Edit
            </button>

            <button className = "px-3 py-1 text-white bg-red-500 rounded-md hover:bg-red-600" 
            onClick={() => deleteTodo(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul> */}

      <div className="overflow-x-auto p-2 no-scrollbar mt-3">
        {/* <table className="w-full text-left">
          <thead>
            <tr className="bg-white p-3 dark:bg-slate-800/50">
              <th>ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Category</th>
              <th>Image</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((product) => (
              <tr key ={product.id}className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.quantity}</td>
                  <td>{product.category}</td>
                  <td>{product.image}</td>
              </tr>
              ))
            }
          </tbody>
        </table> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
            {products.map((item) => (
                <div key={item.id} className="relative group p-5 rounded-2xl border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                            <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 object-cover rounded-lg" onError={(e) => { e.target.src = NoImage }}/>
                        </div>
                        <div className="flex gap-1.5">
                            <button className="p-2 text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
                    {item.subCategory && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{item.subCategory}</span>}
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500">Price</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{item.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-semibold text-slate-500">Stock</p>
                            <p className={`text-sm font-bold ${Number(item.quantity) < 20 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-400'}`}>{item.quantity} units</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

    </div>
  )
}