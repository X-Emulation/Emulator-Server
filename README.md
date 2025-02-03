# EmulatorX-Server

EmulatorX-Server is an optional ROM management server that allows you to organize, store, and download ROMs for your emulators. It is designed to work seamlessly with emulator frontends, providing a centralized location for your game collection.

## Features

- Centralized ROM storage and management
- API for downloading ROMs
- Optional usage—works only if enabled
- Lightweight and easy to set up

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/X-Emulator/EmulatorX-Server.git
   ```
2. Navigate to the project folder:
   ```sh
   cd EmulatorX-Server
   ```
3. Install dependencies:
   ```sh
   yarn
   ```
4. Start the server:
   ```sh
   yarn dev
   ```

## Usage

Once the server is running, you can access it via:
```
http://localhost:1248
```

## Optional Usage

EmulatorX-Server is completely optional. If you prefer to manage ROMs manually, you can disable server integration in your emulator frontend. The system is designed to work with or without it.

## License

This project is licensed under the MIT License.

---

Feel free to contribute or suggest improvements!