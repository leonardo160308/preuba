// backend/models/AdminModel.js
import db from '../config/db.js';

class AdminModel {
    
    // ========================================
    // CATEGORÍAS (Solo lectura)
    // ========================================
    
    static async getAllCategories() {
        const [rows] = await db.execute(
            'SELECT * FROM learning_categories ORDER BY orden ASC'
        );
        return rows;
    }
    
    static async getCategoryById(categoryId) {
        const [rows] = await db.execute(
            'SELECT * FROM learning_categories WHERE id = ?',
            [categoryId]
        );
        return rows[0];
    }
    
    // ========================================
    // VALIDACIONES DE LÍMITES
    // ========================================
    
    static async checkLevelsLimit(categoryId) {
        // Obtener el rango de niveles de la categoría
        const category = await this.getCategoryById(categoryId);
        if (!category) return false;
        
        const totalAllowed = category.nivel_fin - category.nivel_inicio + 1;
        
        // Contar niveles existentes en esa categoría
        const [rows] = await db.execute(
            'SELECT COUNT(*) as total FROM educational_levels WHERE category_id = ?',
            [categoryId]
        );
        
        return rows[0].total < totalAllowed;
    }
    
    static async checkFlashcardsLimit(levelId = null) {
        if (levelId) {
            const [rows] = await db.execute(
                'SELECT COUNT(*) as total FROM flashcards WHERE level_id = ?',
                [levelId]
            );
            return rows[0].total < 30;
        } else {
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM flashcards');
            return rows[0].total < 300;
        }
    }
    
    static async checkQuestionsLimit(levelId = null) {
        if (levelId) {
            const [rows] = await db.execute(
                'SELECT COUNT(*) as total FROM quiz_questions WHERE level_id = ?',
                [levelId]
            );
            return rows[0].total < 15;
        } else {
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM quiz_questions');
            return rows[0].total < 200;
        }
    }

    // ========================================
    // GESTIÓN DE NIVELES
    // ========================================
    
    static async getAllLevels() {
        const [rows] = await db.execute(`
            SELECT el.*, lc.nombre as categoria_nombre 
            FROM educational_levels el
            LEFT JOIN learning_categories lc ON el.category_id = lc.id
            ORDER BY el.category_id ASC, el.orden ASC
        `);
        return rows;
    }
    
    static async getLevelsByCategory(categoryId) {
        const [rows] = await db.execute(
            'SELECT * FROM educational_levels WHERE category_id = ? ORDER BY orden ASC',
            [categoryId]
        );
        return rows;
    }
    
    static async createLevel(nombre, descripcion, categoryId) {
        // Verificar límite
        const canCreate = await this.checkLevelsLimit(categoryId);
        if (!canCreate) {
            throw new Error('Esta categoría ya tiene todos sus niveles completos');
        }
        
        // Obtener el siguiente orden dentro de la categoría
        const [maxOrden] = await db.execute(
            'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM educational_levels WHERE category_id = ?',
            [categoryId]
        );
        
        const query = `
            INSERT INTO educational_levels (nombre, descripcion, orden, category_id) 
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            nombre, 
            descripcion, 
            maxOrden[0].next_orden,
            categoryId
        ]);
        
        return { 
            id: result.insertId, 
            nombre, 
            descripcion, 
            orden: maxOrden[0].next_orden,
            category_id: categoryId
        };
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
    // GESTIÓN DE FLASHCARDS (Sin cambios)
    // ========================================
    
    static async getFlashcardsByLevel(levelId) {
        const [rows] = await db.execute(
            'SELECT * FROM flashcards WHERE level_id = ? ORDER BY orden ASC',
            [levelId]
        );
        return rows;
    }
    
    static async createFlashcard(levelId, titulo, contenido, imagen) {
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
    // GESTIÓN DE PREGUNTAS (Sin cambios)
    // ========================================
    
    static async getQuestionsByLevel(levelId) {
        const [rows] = await db.execute(
            'SELECT * FROM quiz_questions WHERE level_id = ? ORDER BY id ASC',
            [levelId]
        );
        
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
            JSON.stringify(opciones),
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