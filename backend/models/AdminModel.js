// backend/models/AdminModel.js
import db from '../config/db.js';

class AdminModel {
    // ========================================
    // VALIDACIONES DE LÍMITES
    // ========================================
    
    static async checkLevelsLimit() {
        const [rows] = await db.execute('SELECT COUNT(*) as total FROM educational_levels');
        return rows[0].total < 20; // Máximo 20 niveles
    }
    
    static async checkFlashcardsLimit(levelId = null) {
        if (levelId) {
            // Por nivel: máximo 30
            const [rows] = await db.execute(
                'SELECT COUNT(*) as total FROM flashcards WHERE level_id = ?',
                [levelId]
            );
            return rows[0].total < 30;
        } else {
            // Total: máximo 300
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM flashcards');
            return rows[0].total < 300;
        }
    }
    
    static async checkQuestionsLimit(levelId = null) {
        if (levelId) {
            // Por nivel: máximo 15
            const [rows] = await db.execute(
                'SELECT COUNT(*) as total FROM quiz_questions WHERE level_id = ?',
                [levelId]
            );
            return rows[0].total < 15;
        } else {
            // Total: máximo 200
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM quiz_questions');
            return rows[0].total < 200;
        }
    }

    // ========================================
    // GESTIÓN DE NIVELES
    // ========================================
    
    static async getAllLevels() {
        const [rows] = await db.execute(
            'SELECT * FROM educational_levels ORDER BY orden ASC'
        );
        return rows;
    }
    
    static async createLevel(nombre, descripcion) {
        // Obtener el siguiente orden
        const [maxOrden] = await db.execute(
            'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM educational_levels'
        );
        
        const query = `
            INSERT INTO educational_levels (nombre, descripcion, orden) 
            VALUES (?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            nombre, 
            descripcion, 
            maxOrden[0].next_orden
        ]);
        
        return { id: result.insertId, nombre, descripcion, orden: maxOrden[0].next_orden };
    }
    
    static async updateLevel(id, nombre, descripcion) {
        const query = `
            UPDATE educational_levels 
            SET nombre = ?, descripcion = ? 
            WHERE id = ?
        `;
        
        await db.execute(query, [nombre, descripcion, id]);
        return { id, nombre, descripcion };
    }
    
    static async deleteLevel(id) {
        // Verificar si tiene contenido asociado
        const [flashcards] = await db.execute(
            'SELECT COUNT(*) as total FROM flashcards WHERE level_id = ?',
            [id]
        );
        
        const [questions] = await db.execute(
            'SELECT COUNT(*) as total FROM quiz_questions WHERE level_id = ?',
            [id]
        );
        
        const hasContent = flashcards[0].total > 0 || questions[0].total > 0;
        
        if (hasContent) {
            return {
                success: false,
                message: `Este nivel tiene ${flashcards[0].total} flashcards y ${questions[0].total} preguntas. Elimínalas primero.`,
                flashcards: flashcards[0].total,
                questions: questions[0].total
            };
        }
        
        await db.execute('DELETE FROM educational_levels WHERE id = ?', [id]);
        return { success: true };
    }

    // ========================================
    // GESTIÓN DE FLASHCARDS
    // ========================================
    
    static async getFlashcardsByLevel(levelId) {
        const [rows] = await db.execute(
            'SELECT * FROM flashcards WHERE level_id = ? ORDER BY orden ASC',
            [levelId]
        );
        return rows;
    }
    
    static async createFlashcard(levelId, titulo, contenido, imagen) {
        // Obtener siguiente orden dentro del nivel
        const [maxOrden] = await db.execute(
            'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM flashcards WHERE level_id = ?',
            [levelId]
        );
        
        const query = `
            INSERT INTO flashcards (level_id, titulo, contenido, imagen, orden) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            levelId,
            titulo,
            contenido,
            imagen || null,
            maxOrden[0].next_orden
        ]);
        
        return { 
            id: result.insertId, 
            level_id: levelId, 
            titulo, 
            contenido, 
            imagen,
            orden: maxOrden[0].next_orden
        };
    }
    
    static async updateFlashcard(id, titulo, contenido, imagen) {
        const query = `
            UPDATE flashcards 
            SET titulo = ?, contenido = ?, imagen = ? 
            WHERE id = ?
        `;
        
        await db.execute(query, [titulo, contenido, imagen || null, id]);
        return { id, titulo, contenido, imagen };
    }
    
    static async deleteFlashcard(id) {
        await db.execute('DELETE FROM flashcards WHERE id = ?', [id]);
        return { success: true };
    }
    
    static async moveFlashcard(id, newLevelId) {
        await db.execute(
            'UPDATE flashcards SET level_id = ? WHERE id = ?',
            [newLevelId, id]
        );
        return { success: true };
    }

    // ========================================
    // GESTIÓN DE PREGUNTAS DE QUIZ
    // ========================================
    
    static async getQuestionsByLevel(levelId) {
        const [rows] = await db.execute(
            'SELECT * FROM quiz_questions WHERE level_id = ? ORDER BY id ASC',
            [levelId]
        );
        
        // Parsear JSON de opciones
        return rows.map(q => ({
            ...q,
            opciones: JSON.parse(q.opciones)
        }));
    }
    
    static async createQuestion(levelId, pregunta, opciones, correcta, dificultad, imagen) {
        const query = `
            INSERT INTO quiz_questions (level_id, pregunta, opciones, correcta, dificultad, imagen) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            levelId,
            pregunta,
            JSON.stringify(opciones), // Convertir objeto a JSON
            correcta,
            dificultad || 'media',
            imagen || null
        ]);
        
        return { 
            id: result.insertId, 
            level_id: levelId, 
            pregunta, 
            opciones,
            correcta,
            dificultad,
            imagen
        };
    }
    
    static async updateQuestion(id, pregunta, opciones, correcta, dificultad, imagen) {
        const query = `
            UPDATE quiz_questions 
            SET pregunta = ?, opciones = ?, correcta = ?, dificultad = ?, imagen = ? 
            WHERE id = ?
        `;
        
        await db.execute(query, [
            pregunta,
            JSON.stringify(opciones),
            correcta,
            dificultad,
            imagen || null,
            id
        ]);
        
        return { id, pregunta, opciones, correcta, dificultad, imagen };
    }
    
    static async deleteQuestion(id) {
        await db.execute('DELETE FROM quiz_questions WHERE id = ?', [id]);
        return { success: true };
    }
}

export default AdminModel;