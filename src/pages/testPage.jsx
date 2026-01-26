import React, {useEffect, useState} from 'react'
import { supabase } from "../lib/supabase";
import {Plus, Pencil} from "lucide-react";


export default function Test() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState(null)

  // READ
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true })

    if (!error) setTodos(data)
  }

  useEffect(() => {
    fetchTodos()

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('todos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => {
          fetchTodos()
        }
      )
      .subscribe()

    // CLEANUP
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // CREATE
  const addTodo = async () => {
    if (!title) return
    await supabase.from('todos').insert({ title })
    setTitle('')
  }

  // UPDATE
  const updateTodo = async (id) => {
    await supabase
      .from('todos')
      .update({ title })
      .eq('id', id)

    setEditingId(null)
    setTitle('')
  }

  // DELETE
  const deleteTodo = async (id) => {
    await supabase
      .from('todos')
      .delete()
      .eq('id', id)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 className = "text-xl mb-3">Realtime Supabase CRUD</h2>

      <div className = "flex items-center">
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
      </div>

      <ul className = "mt-3 space-y-4">
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

            <button className = "px-3 py-1 text-white bg-red-500 rounded-md hover:bg-blue-600" 
            onClick={() => deleteTodo(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}