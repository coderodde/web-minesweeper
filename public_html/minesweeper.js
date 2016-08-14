var MinesweeperFieldTile = function(ownerField, x, y) {
    this.ownerField = ownerField;
    this.x = x;
    this.y = y;
    this.isCleared = false;
    this.mine = false;
    this.count = -1;
};

MinesweeperFieldTile.prototype.setMine = function() {
    this.mine = true;
};

MinesweeperFieldTile.prototype.hasMine = function() {
    return this.mine;
};

MinesweeperFieldTile.prototype.open = function() {
    this.isCleared = true;
    
    if (!this.mine) {
        this.count = this.getNumberOfMinesInNeighbours();
    }
};

MinesweeperFieldTile.prototype.isOpen = function() {
    return this.isCleared;
};

MinesweeperFieldTile.prototype.readMineCount = function() {
    return this.count;
};

MinesweeperFieldTile.prototype.getNumberOfMinesInNeighbours = function() {
    var neighbourTileList = [];
    var x = this.x;
    var y = this.y;
    
    neighbourTileList.push(this.ownerField.getTile(x - 1, y - 1));
    neighbourTileList.push(this.ownerField.getTile(x, y - 1));
    neighbourTileList.push(this.ownerField.getTile(x + 1, y - 1));
    
    neighbourTileList.push(this.ownerField.getTile(x - 1, y));
    neighbourTileList.push(this.ownerField.getTile(x + 1, y));
    
    neighbourTileList.push(this.ownerField.getTile(x - 1, y + 1));
    neighbourTileList.push(this.ownerField.getTile(x, y + 1));
    neighbourTileList.push(this.ownerField.getTile(x + 1, y + 1));
    
    var neighbourMineCount = 0;
    
    for (var i = 0; i < neighbourTileList.length; ++i) {
        if (neighbourTileList[i] && neighbourTileList[i].hasMine()) {
            neighbourMineCount++;
        }
    }
    
    return neighbourMineCount;
};

var MinesweeperField = function(width, height) {
    this.width  = width;
    this.height = height;
    this.rows   = [];
    
    for (var rowIndex = 0; rowIndex < height; ++rowIndex) {
        var row = [];
        
        for (var columnIndex = 0; columnIndex < width; ++columnIndex) {
            row[columnIndex] = new MinesweeperFieldTile(this,
                                                        columnIndex,
                                                        rowIndex);
        }

        this.rows.push(row);
    }
};

MinesweeperField.prototype.getTile = function(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return;
    }
    
    return this.rows[y][x];
};

MinesweeperField.prototype.getWidth = function() {
    return this.width;
};

MinesweeperField.prototype.getHeight = function() {
    return this.height;
};

function populateMinesweeperFieldWithMines(minesweeperField, 
                                           mineCoordinateList) {
    for (var i = 0; i < mineCoordinateList.length; ++i) {
        var tile = minesweeperField.getTile(mineCoordinateList[i].x,
                                            mineCoordinateList[i].y);
        tile.setMine();
    }
}

function shuffle(a) {
    var j, x, i;

    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function createRandomMinesForField(minesweeperField, mineLoadFactor) {
    var mineCoordinateList = [];
    
    var totalNumberOfTiles = minesweeperField.getWidth() *
                             minesweeperField.getHeight();
                     
    var totalNumberOfMines = Math.floor(mineLoadFactor * totalNumberOfTiles);
    totalNumberOfMines = Math.min(totalNumberOfMines, totalNumberOfTiles);
    
    // Generate the array of all possible tile coordinates:
    for (var y = 0; y < minesweeperField.getHeight(); ++y) {
        for (var x = 0; x < minesweeperField.getWidth(); ++x) {
            mineCoordinateList.push({x: x, y: y});
        }
    }
    
    shuffle(mineCoordinateList);
    return mineCoordinateList.slice(0, totalNumberOfMines);
}

var CanvasView = function(field, canvas) {
    this.field = field;
    this.canvas = canvas;
    this.context = canvas.getContext("2d", {alpha: false});
    this.highlightX = field.getWidth() / 2;
    this.highlightY = field.getHeight() / 2;
    this.previousValidHighlightX = this.highlightX;
    this.previousValidHighlightY = this.highlightY;
    
    this.canvas.width  = (field.getWidth() + 1) + field.getWidth() * 40;
    this.canvas.height = (field.getHeight() + 1) + field.getHeight() * 40;
    
    var that = this;
    
    this.canvas.addEventListener('mousemove', function(event) {
        var rect = canvas.getBoundingClientRect();
        
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        
        if ((x % 41 === 0) || (y % 41 === 0)) {
            that.highlightX = -1;
            that.draw();
            console.log("border!");
        } else {
            var tileX = Math.floor((x - 1) / 41);
            var tileY = Math.floor((y - 1) / 41);
            
            if (tileX >= 0 && tileY >= 0) {
                that.previousValidHighlightX = that.highlightX;
                that.previousValidHighlightY = that.highlightY;
                that.highlightX = tileX;
                that.highlightY = tileY;
                that.draw();
            }
        }
    });  
    
    this.canvas.addEventListener('mouseout', function(event) {
        that.highlightX = that.previousValidHighlightX;
        that.highlightY = that.previousValidHighlightY;
        that.draw();
    });
    
    this.canvas.addEventListener('click', function(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        
        if (x % 41 === 0 || y % 41 === 0) {
            // The user clicked the border. Do nothing.
        } else {
            var tileX = Math.floor((x - 1) / 41);
            var tileY = Math.floor((y - 1) / 41);
            
            var field = that.field;
            var fieldTile = field.getTile(tileX, tileY);
            
            if (fieldTile.isOpen()) {
                // The tile was already opened. Since we are still executing,
                // fieldTile did not contain a mine.
            } else if (fieldTile.hasMine()) {
                fieldTile.open();
                alert("Kaboom!");
                return;
            } else {
                fieldTile.open();
                that.draw();
            }
        }
    });
};

CanvasView.prototype.openTile = function(x, y) {
    var tile = this.field.getTile(x, y);
    tile.open();
    this.draw();
};

CanvasView.prototype.draw = function() {
    this.context.fillStyle = "#000000";
    this.context.rect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fill();
    
    this.context.strokeStyle = "#888888";
    
    // Draw the horizontal separator bars:
    for (var y = 0; y < this.field.getHeight() + 1; ++y) {
        this.context.beginPath();
        this.context.moveTo(0.5, 41 * y + 0.5);
        this.context.lineTo(this.canvas.width + 0.5, 41 * y + 0.5);
        this.context.stroke();
    }
    
    // Draw the vertical separator bars:
    for (var x = 0; x < this.field.getWidth() + 1; ++x) {
        this.context.beginPath();
        this.context.moveTo(41 * x + 0.5, 0.5);
        this.context.lineTo(41 * x + 0.5, this.canvas.height + 0.5);
        this.context.stroke();
    }
    
    // Draw the tiles:
    for (var y = 0; y < this.field.getHeight(); ++y) {
        for (var x = 0; x < this.field.getWidth(); ++x) {
            if (this.field.getTile(x, y).isOpen()) {
                if (this.field.getTile(x, y).hasMine()) {
                    this.context.fillStyle = "red";
                } else {
                    this.context.fillStyle = "white";
                }
                
                this.context.fillRect(1 + 41 * x, 1 + 41 * y, 40, 40);
                this.context.fill();
                
                if (this.field.getTile(x, y).hasMine()) {
                    this.context.fillStyle = "white";
                    this.context.font = "35px Monospaced";
                    this.context.fillText("!", 15 + 41 * x, 32 + 41 * y);
                } else {
                    
                }
            }
        }
    }
    
    // Draw the highlight of a tile:
    if (this.highlightX >= 0 && this.highlightY >= 0) {
        this.context.fillStyle = "#FF9100";
        this.context.fillRect(1 + 41 * this.highlightX,
                              1 + 41 * this.highlightY, 
                              40, 
                              40);
    }
};

var canvas = document.getElementById("my_canvas");
var view = new CanvasView(test(), canvas);
view.draw();

function test() {
    var field = new MinesweeperField(10, 8);
    var coords = createRandomMinesForField(field, 0.5);
    populateMinesweeperFieldWithMines(field, coords);
    
    var str = "";
    
    for (var y = 0; y < field.getHeight(); ++y) {
        for (var x = 0; x < field.getWidth(); ++x) {
            if (field.getTile(x, y).hasMine()) {
                str += '*';
            } else {
                str += field.getTile(x, y).getNumberOfMinesInNeighbours();
            }
        }
        
        str += "\n";
    }
    
    console.log(str);
    
    return field;
}
