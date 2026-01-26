import React, {useEffect, useState} from 'react'
import { supabase } from "../lib/supabase";


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
      <h2>Realtime Supabase CRUD</h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Todo title"
      />

      {editingId ? (
        <button onClick={() => updateTodo(editingId)}>Update</button>
      ) : (
        <button onClick={addTodo}>Add</button>
      )}

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title}

            <button
              onClick={() => {
                setEditingId(todo.id)
                setTitle(todo.title)
              }}
            >
              Edit
            </button>

            <button onClick={() => deleteTodo(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}