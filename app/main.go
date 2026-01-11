package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

type SaveRequest struct {
	Content string `json:"content"`
	Filename string `json:"filename"`
}

func main() {
	// Create files directory if not exists
	filesDir := "/app/files"
	if err := os.MkdirAll(filesDir, 0755); err != nil {
		log.Fatal(err)
	}

	// API endpoints
	http.HandleFunc("/api/save", saveHandler)
	http.HandleFunc("/api/load", loadHandler)
	http.HandleFunc("/api/list", listHandler)
	
	// Serve static files from nginx static directory
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "/var/www/html"+r.URL.Path)
	})

	port := ":8080"
	fmt.Println("Server starting on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func saveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SaveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	filename := req.Filename
	if filename == "" {
		filename = "document.txt"
	}
	if !filepath.Ext(filename) {
		filename += ".txt"
	}

	filepath := filepath.Join("/app/files", filename)
	if err := os.WriteFile(filepath, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"filepath": filepath,
	})
}

func loadHandler(w http.ResponseWriter, r *http.Request) {
	filename := r.URL.Query().Get("filename")
	if filename == "" {
		http.Error(w, "Filename required", http.StatusBadRequest)
		return
	}

	filepath := filepath.Join("/app/files", filename)
	content, err := os.ReadFile(filepath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"content": string(content),
		"filename": filename,
	})
}

func listHandler(w http.ResponseWriter, r *http.Request) {
	files, err := filepath.Glob("/app/files/*.txt")
	if err != nil {
		http.Error(w, "Failed to list files", http.StatusInternalServerError)
		return
	}

	var filenames []string
	for _, f := range files {
		filenames = append(filenames, filepath.Base(f))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]string{
		"files": filenames,
	})
}
