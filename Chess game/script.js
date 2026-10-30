// Unicode chess symbols for visual display
const PIECE_SYMBOLS = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Initial Board State (8x8 grid)
// Index 0 represents Rank 8 (Black side), Index 7 represents Rank 1 (White side)
const initialBoardState = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Global Game State
let board = JSON.parse(JSON.stringify(initialBoardState));
let currentTurn = 'white'; // 'white' or 'black'
let selectedSquare = null; // e.g., { row: 6, col: 4 }
let validMoves = [];       // Array of { row, col } destination coordinates

let capturedPieces = {
    white: [], // Pieces captured BY white (black pieces)
    black: []  // Pieces captured BY black (white pieces)
};

// Advanced state trackers
let castlingRights = {
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true }
};
let enPassantTarget = null; // Stores target square { row, col } when a pawn moves two squares

// Acts as bridge between HTML and js file
const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('current-turn');
const capturedWhiteElement = document.getElementById('captured-white');
const capturedBlackElement = document.getElementById('captured-black');

// Function to render the entire board and UI panels
// Function to render the entire board and UI panels
function renderBoard() {
    boardElement.innerHTML = ''; // Clear current rendering

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');

            // Determine light or dark square background
            const isLight = (row + col) % 2 === 0;
            square.classList.add('square', isLight ? 'light' : 'dark');

            // Store board coordinates on DOM elements using data attributes
            square.dataset.row = row;
            square.dataset.col = col;

            // Check if square contains a piece
            const piece = board[row][col];
            if (piece) {
                square.textContent = PIECE_SYMBOLS[piece];

                // ADDED: Apply distinct color styling based on piece ownership
                if (isWhitePiece(piece)) {
                    square.classList.add('piece-white');
                } else if (isBlackPiece(piece)) {
                    square.classList.add('piece-black');
                }
            }

            // Highlight selected square
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('selected');
            }

            // Highlight valid moves
            if (validMoves.some(m => m.row === row && m.col === col)) {
                if (piece) {
                    square.classList.add('valid-capture');
                } else {
                    square.classList.add('valid-move');
                }
            }

            boardElement.appendChild(square);
        }
    }

    // Update Turn Text
    turnIndicator.textContent = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);

    // Update Captured Pieces Displays
    capturedBlackElement.textContent = capturedPieces.white.map(p => PIECE_SYMBOLS[p]).join(' ');
    capturedWhiteElement.textContent = capturedPieces.black.map(p => PIECE_SYMBOLS[p]).join(' ');
}
// Initial Call to draw board on load
renderBoard();

// --- HELPER FUNCTIONS ---

// Check if a piece is white (uppercase letters represent white pieces)
function isWhitePiece(piece) {
    return piece && piece === piece.toUpperCase();
}

// Check if a piece is black (lowercase letters represent black pieces)
function isBlackPiece(piece) {
    return piece && piece === piece.toLowerCase();
}

// Check whose turn it is and whether the piece matches the current turn
function isCurrentPlayersPiece(piece) {
    if (!piece) return false;
    if (currentTurn === 'white' && isWhitePiece(piece)) return true;
    if (currentTurn === 'black' && isBlackPiece(piece)) return true;
    return false;
}


// --- INTERACTION & CLICK HANDLING ---

// Listen for clicks on the chessboard container
boardElement.addEventListener('click', (event) => {
    // Find which square was clicked (ensuring we target the square div)
    const squareElement = event.target.closest('.square');
    if (!squareElement) return;

    // Read the row and col coordinates from our dataset attributes
    const row = parseInt(squareElement.dataset.row);
    const col = parseInt(squareElement.dataset.col);
    const clickedPiece = board[row][col];

    // SCENARIO 1: If a square is already selected, check if we are making a move or changing selection
    if (selectedSquare) {
        // If the user clicked on one of the valid destination moves
        const isValidMove = validMoves.some(m => m.row === row && m.col === col);

        if (isValidMove) {
            // Execute the move (we will write this move execution function next!)
            executeMove(selectedSquare.row, selectedSquare.col, row, col);

            // Reset selection after moving
            selectedSquare = null;
            validMoves = [];
        }
        // If the user clicked on another one of their own pieces, change the selection to that piece
        else if (isCurrentPlayersPiece(clickedPiece)) {
            selectedSquare = { row, col };
            // TODO: Calculate valid moves for this piece

            validMoves = getValidMoves(row, col); // Temporary until we write move generation
        }
        // Otherwise, deselect
        else {
            selectedSquare = null;
            validMoves = [];
        }
    }

    // SCENARIO 2: No square is selected yet, so try to select a piece
    else {
        if (isCurrentPlayersPiece(clickedPiece)) {
            selectedSquare = { row, col };
            // TODO: Calculate valid moves for this piece
            validMoves = getValidMoves(row, col); // Temporary until we write move generation
        }
    }

    // Re-render the board to reflect selection highlights
    renderBoard();
});

// Temporary placeholder for move execution so code doesn't break when clicked
// --- MOVE EXECUTION ENGINE ---

// --- UPDATED MOVE EXECUTION ENGINE ---

function executeMove(fromRow, fromCol, toRow, toCol) {
    const movingPiece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    const isWhite = isWhitePiece(movingPiece);

    // 1. Handle Captures
    if (targetPiece !== null) {
        if (isWhite) {
            capturedPieces.white.push(targetPiece);
        } else {
            capturedPieces.black.push(targetPiece);
        }
    }

    // 2. Handle Castling Execution
    if (movingPiece.toLowerCase() === 'k' && Math.abs(toCol - fromCol) === 2) {
        // King moved two steps horizontally -> it's a castle!
        const row = fromRow;
        if (toCol === 6) {
            // Kingside Castle: Move Rook from col 7 to col 5
            const rook = board[row][7];
            board[row][5] = rook;
            board[row][7] = null;
        } else if (toCol === 2) {
            // Queenside Castle: Move Rook from col 0 to col 3
            const rook = board[row][0];
            board[row][3] = rook;
            board[row][0] = null;
        }
    }

    // 3. Update Castling Rights if King or Rooks move
    if (movingPiece === 'K') {
        castlingRights.white.kingSide = false;
        castlingRights.white.queenSide = false;
    } else if (movingPiece === 'k') {
        castlingRights.black.kingSide = false;
        castlingRights.black.queenSide = false;
    } else if (movingPiece === 'R') {
        if (fromRow === 7 && fromCol === 7) castlingRights.white.kingSide = false;
        if (fromRow === 7 && fromCol === 0) castlingRights.white.queenSide = false;
    } else if (movingPiece === 'r') {
        if (fromRow === 0 && fromCol === 7) castlingRights.black.kingSide = false;
        if (fromRow === 0 && fromCol === 0) castlingRights.black.queenSide = false;
    }

    // 4. Move the piece on our 2D board array
    board[toRow][toCol] = movingPiece;
    board[fromRow][fromCol] = null;

    // 5. Handle Pawn Promotion
    if (movingPiece === 'P' && toRow === 0) {
        board[toRow][toCol] = 'Q';
    } else if (movingPiece === 'p' && toRow === 7) {
        board[toRow][toCol] = 'q';
    }

    // 6. Switch Turns
    currentTurn = currentTurn === 'white' ? 'black' : 'white';

    // 7. Handle Pawn Promotion
    if (movingPiece === 'P' && toRow === 0) {
        board[toRow][toCol] = 'Q';
    } else if (movingPiece === 'p' && toRow === 7) {
        board[toRow][toCol] = 'q';
    }

    // 8. Switch Turns
    currentTurn = currentTurn === 'white' ? 'black' : 'white';

    // Switch Turns
    currentTurn = currentTurn === 'white' ? 'black' : 'white';

    // Check if the new player has any legal moves left (Checkmate / Stalemate)
    setTimeout(checkGameEndConditions, 100);
    // Using setTimeout ensures the board renders the final move before the alert pops up!
}

// --- MOVE GENERATION ENGINE ---

// Main function to get valid moves for any piece at a given position
// Update getValidMoves to filter out moves that result in check:
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const pseudoMoves = getPseudoLegalMoves(row, col);
    const legalMoves = [];
    const playerColor = isWhitePiece(piece) ? 'white' : 'black';

    for (let move of pseudoMoves) {
        // Simulate the move on a cloned board copy
        const clonedBoard = JSON.parse(JSON.stringify(board));

        // Perform simulated move
        clonedBoard[move.row][move.col] = clonedBoard[row][col];
        clonedBoard[row][col] = null;

        // Temporarily replace global board with clone to test check status
        const originalBoard = board;
        board = clonedBoard;

        const stillInCheck = isInCheck(playerColor);

        // Restore original board
        board = originalBoard;

        // If the move does not leave our king in check, it is fully legal!
        if (!stillInCheck) {
            legalMoves.push(move);
        }
    }

    return legalMoves;
}

// Helper to get raw pseudo-legal moves before safety filtering
function getPseudoLegalMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const pieceType = piece.toLowerCase();

    switch (pieceType) {
        case 'p': return getPseudoPawnMoves(row, col, piece);
        case 'n': return getPseudoKnightMoves(row, col, piece);
        case 'r': return getPseudoRookMoves(row, col, piece);
        case 'b': return getPseudoBishopMoves(row, col, piece);
        case 'q': return getPseudoQueenMoves(row, col, piece);
        case 'k': return getPseudoKingMoves(row, col, piece);
        default: return [];
    }
}

// Helper to check if coordinates are inside the 8x8 board grid
function isOnBoard(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// --- PAWN MOVES ---
// --- UPDATED PAWN MOVES (Includes regular moves, double steps, and En Passant) ---
function getPseudoPawnMoves(row, col, piece) {
    const moves = [];
    const isWhite = isWhitePiece(piece);

    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // 1. Move forward one square
    const forwardRow = row + direction;
    if (isOnBoard(forwardRow, col) && board[forwardRow][col] === null) {
        moves.push({ row: forwardRow, col: col });

        // 2. Move forward two squares from the starting row
        const doubleForwardRow = row + (direction * 2);
        if (row === startRow && board[doubleForwardRow][col] === null) {
            moves.push({ row: doubleForwardRow, col: col });
        }
    }

    // 3. Standard Diagonal Captures & En Passant
    const captureCols = [col - 1, col + 1];
    for (let cCol of captureCols) {
        if (isOnBoard(forwardRow, cCol)) {
            const targetPiece = board[forwardRow][cCol];
            if (targetPiece !== null) {
                // Regular capture
                if (isWhite && isBlackPiece(targetPiece)) {
                    moves.push({ row: forwardRow, col: cCol });
                } else if (!isWhite && isWhitePiece(targetPiece)) {
                    moves.push({ row: forwardRow, col: cCol });
                }
            }
            // Check for En Passant capture
            else if (enPassantTarget && enPassantTarget.row === forwardRow && enPassantTarget.col === cCol) {
                moves.push({ row: forwardRow, col: cCol });
            }
        }
    }

    return moves;
}

// --- KNIGHT MOVES ---
function getPseudoKnightMoves(row, col, piece) {
    const moves = [];
    const isWhite = isWhitePiece(piece);

    // Knights move in an "L" shape: 2 steps in one direction, 1 step perpendicular
    const offsets = [
        { r: -2, c: -1 }, { r: -2, c: 1 },
        { r: -1, c: -2 }, { r: -1, c: 2 },
        { r: 1, c: -2 }, { r: 1, c: 2 },
        { r: 2, c: -1 }, { r: 2, c: 1 }
    ];

    for (let offset of offsets) {
        const targetRow = row + offset.r;
        const targetCol = col + offset.c;

        if (isOnBoard(targetRow, targetCol)) {
            const targetPiece = board[targetRow][targetCol];

            // A knight can land on an empty square OR capture an opponent piece
            if (targetPiece === null) {
                moves.push({ row: targetRow, col: targetCol });
            } else {
                if (isWhite && isBlackPiece(targetPiece)) {
                    moves.push({ row: targetRow, col: targetCol });
                } else if (!isWhite && isWhitePiece(targetPiece)) {
                    moves.push({ row: targetRow, col: targetCol });
                }
            }
        }
    }

    return moves;
}


// --- SLIDING PIECES HELPER ---
// Loops outward in a specific direction until it hits the edge or another piece
function getSliderMoves(row, col, piece, directions) {
    const moves = [];
    const isWhite = isWhitePiece(piece);

    for (let dir of directions) {
        let currRow = row + dir.r;
        let currCol = col + dir.c;

        while (isOnBoard(currRow, currCol)) {
            const targetPiece = board[currRow][currCol];

            if (targetPiece === null) {
                // Empty square, valid move, keep sliding in this direction
                moves.push({ row: currRow, col: currCol });
            } else {
                // Hit a piece! Check if it's an opponent piece (valid capture)
                if (isWhite && isBlackPiece(targetPiece)) {
                    moves.push({ row: currRow, col: currCol });
                } else if (!isWhite && isWhitePiece(targetPiece)) {
                    moves.push({ row: currRow, col: currCol });
                }
                // Stop sliding further in this direction once we hit any piece
                break;
            }

            currRow += dir.r;
            currCol += dir.c;
        }
    }

    return moves;
}

// --- ROOK MOVES (Horizontal and Vertical) ---
function getPseudoRookMoves(row, col, piece) {
    const directions = [
        { r: -1, c: 0 }, // Up
        { r: 1, c: 0 },  // Down
        { r: 0, c: -1 }, // Left
        { r: 0, c: 1 }   // Right
    ];
    return getSliderMoves(row, col, piece, directions);
}

// --- BISHOP MOVES (Diagonals) ---
function getPseudoBishopMoves(row, col, piece) {
    const directions = [
        { r: -1, c: -1 }, // Top-Left
        { r: -1, c: 1 },  // Top-Right
        { r: 1, c: -1 },  // Bottom-Left
        { r: 1, c: 1 }    // Bottom-Right
    ];
    return getSliderMoves(row, col, piece, directions);
}

// --- QUEEN MOVES (Combines Rook and Bishop directions) ---
function getPseudoQueenMoves(row, col, piece) {
    const directions = [
        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
        { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
    ];
    return getSliderMoves(row, col, piece, directions);
}

// --- KING MOVES (One square in any direction) ---
// --- UPDATED KING MOVES (Includes regular moves + Castling) ---
function getPseudoKingMoves(row, col, piece) {
    const moves = [];
    const isWhite = isWhitePiece(piece);

    const directions = [
        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
        { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
    ];

    // 1. Regular 1-square moves
    for (let dir of directions) {
        const targetRow = row + dir.r;
        const targetCol = col + dir.c;

        if (isOnBoard(targetRow, targetCol)) {
            const targetPiece = board[targetRow][targetCol];
            if (targetPiece === null) {
                moves.push({ row: targetRow, col: targetCol });
            } else {
                if (isWhite && isBlackPiece(targetPiece)) {
                    moves.push({ row: targetRow, col: targetCol });
                } else if (!isWhite && isWhitePiece(targetPiece)) {
                    moves.push({ row: targetRow, col: targetCol });
                }
            }
        }
    }

    // 2. Castling Moves
    const kingRow = isWhite ? 7 : 0;
    // Ensure the king is on its starting square
    if (row === kingRow && col === 4) {
        const rights = isWhite ? castlingRights.white : castlingRights.black;

        // Kingside Castling
        if (rights.kingSide) {
            // Check if squares between King (col 4) and Rook (col 7) are empty
            if (board[kingRow][5] === null && board[kingRow][6] === null) {
                moves.push({ row: kingRow, col: 6 });
            }
        }

        // Queenside Castling
        if (rights.queenSide) {
            // Check if squares between King (col 4) and Rook (col 0) are empty
            if (board[kingRow][1] === null && board[kingRow][2] === null && board[kingRow][3] === null) {
                moves.push({ row: kingRow, col: 2 });
            }
        }
    }

    return moves;
}


// --- CHECK & ATTACK VALIDATION ENGINE ---

// 1. Check if a specific square (row, col) is being attacked by the opponent of 'isWhite'
function isSquareAttacked(row, col, attackingColor) {
    // Loop through every square on the board to find opponent pieces
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;

            // Check if the piece belongs to the attacking color
            const pieceIsWhite = isWhitePiece(piece);
            if ((attackingColor === 'white' && pieceIsWhite) || (attackingColor === 'black' && !pieceIsWhite)) {
                // Generate pseudo-legal moves for this piece without recursive check filters
                const pseudoMoves = getPseudoLegalMoves(r, c);
                // If any move targets our target square, it is under attack!
                if (pseudoMoves.some(m => m.row === row && m.col === col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 2. Helper to find the King's current coordinate for a given color
function findKing(color) {
    const kingSymbol = color === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingSymbol) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

// 3. Helper to check if a player's King is currently in check
function isInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;
    const attackingColor = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(kingPos.row, kingPos.col, attackingColor);
}


// --- GAME STATE & CHECKMATE ENGINE ---

// Check if the current player has any legal moves available anywhere on the board
function hasAnyLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;

            // Check if piece belongs to the current color
            const isWhite = isWhitePiece(piece);
            if ((color === 'white' && isWhite) || (color === 'black' && !isWhite)) {
                const legalMoves = getValidMoves(r, c);
                if (legalMoves.length > 0) {
                    return true; // Found at least one legal move!
                }
            }
        }
    }
    return false; // No legal moves left for this player
}

// Check for Checkmate or Stalemate after a turn switches
function checkGameEndConditions() {
    const inCheck = isInCheck(currentTurn);
    const hasMoves = hasAnyLegalMoves(currentTurn);

    if (!hasMoves) {
        if (inCheck) {
            const winner = currentTurn === 'white' ? 'Black' : 'White';
            alert(`Checkmate! ${winner} wins the game!`);
        } else {
            alert(`Stalemate! The game is a draw.`);
        }
    }
}