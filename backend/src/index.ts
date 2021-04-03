import express, {
  Application,
  json,
  Request,
  Response,
  urlencoded,
} from "express";
import * as http from "http";
import * as mongodb from "mongodb";
import { randomBytes } from "crypto";

const DATABASE_URL = "mongodb://localhost:27017/";
const DEFAULT_BYTES_LENGTH = 4;
const URL_PREFIX = "http://138.68.183.151:3000/";

export default class App {
  private app: Application;
  private server: http.Server;
  private database: mongodb.Db | undefined;
  private client: mongodb.MongoClient | undefined;

  constructor() {
    mongodb.MongoClient.connect(
      DATABASE_URL,
      { useUnifiedTopology: true },
      (err: mongodb.MongoError, db: mongodb.MongoClient) => {
        if (err) return;
        this.client = db;
        this.database = db.db("shortener-db");
      }
    );

    this.app = express();

    this.app.use(urlencoded({ extended: true }));
    this.app.use(json());

    this.app.post("/api/shorten", (req, res) => this.shorten(req, res));
    this.app.get("/:id", (req, res) => this.redirect(req, res));

    this.server = http.createServer(this.app);
  }

  private redirect(req: Request, res: Response) {
    if (!this.database) {
      res.status(500).send({
        error: "Internal server error - database missing or corrupt.",
      });
      return;
    }

    if (!("id" in req.params)) {
      res
        .status(400)
        .send({ error: 'Invalid parameters - "id" parameter required' });
      return;
    }

    const id = req.params["id"];
    this.database
      .collection("shortens")
      .findOne({ _id: id }, (err: mongodb.MongoError, result: any) => {
        if (err) throw err;
        if (result && "url" in result) {
          res.status(302).redirect(result["url"]);
          return;
        }
        res.status(400).send({
          error: `Invalid parameters - ${id} is not registed in our database.`,
        });
      });
  }

  private async shorten(req: Request, res: Response) {
    console.log(req.body);

    if (!this.database) {
      res.status(500).send({
        error: "Internal server error - database missing or corrupt.",
      });
      return;
    }

    if (!("url" in req.body)) {
      res
        .status(400)
        .send({ error: 'Invalid parameters: "url" field required.' });
      return;
    }

    const url = req.body["url"];
    if (!this.isURLValid(url)) {
      res
        .status(400)
        .send({ error: 'Invalid parameters: "url" field is invalid.' });
      return;
    }

    // TODO: Date added, clicks, etc.
    const id = randomBytes(await this.getBytesLength()).toString("hex");
    const data = {
      url: url,
      _id: id,
    };
    this.database
      .collection("shortens")
      .insertOne(data, (err: mongodb.MongoError) => {
        if (err) throw err;
        res.status(500).send({ error: "Internal server error" });
        return;
      });

    res.status(200).send({ shortened: URL_PREFIX + id, url: url });
  }

  private isURLValid(url: string): boolean {
    try {
      new URL(url);
    } catch (_) {
      return false;
    }
    return true;
  }

  public close() {
    if (this.client) {
      this.client.close();
    }
  }

  private async getBytesLength(): Promise<number> {
    if (!this.database) {
      return DEFAULT_BYTES_LENGTH;
    }
    const size = (await this.database.collection("shortens").count()) + 1;
    let bits: number = 32;
    while (Math.pow(2, bits) < size) bits++;
    return Math.ceil(bits / 8);
  }

  public listen(port: number) {
    console.log(`Listening on port: ${port}`);
    this.server.listen(port);
  }
}

let app = new App();
app.listen(3000);
app.close();
