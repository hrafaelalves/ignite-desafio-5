import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Head from 'next/head';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostPagination {
  title: string;
  uid: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost: PostPagination | null;
  nextPost: PostPagination | null;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  const formattedPost = useMemo(() => {
    const formattedDate = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    );

    const formattedLastDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' HH:mm",
      { locale: ptBR }
    );

    return {
      ...post,
      first_publication_date: formattedDate,
      last_publication_date: formattedLastDate,
    };
  }, [post]);

  const readOfTime = useMemo(() => {
    const words = post.data.content.reduce((accumulate, current) => {
      const { heading, body } = current;

      const countCurrentHeading = heading.split(' ');

      const countBodyCurrent = body.reduce((accumulate_body, current_body) => {
        const countBody = current_body.text.split(' ');

        return accumulate_body + countBody.length;
      }, 0);

      return accumulate + countCurrentHeading.length + countBodyCurrent;
    }, 0);

    return Math.ceil(words / 200);
  }, [post]);

  useEffect(() => {
    const scriptParentNode = document.getElementById('comments');

    console.log(scriptParentNode);

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'hrafaelalves/spacetraveling-comments');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    // eslint-disable-next-line consistent-return
    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild as Node);
    };
  }, []);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Spacetraveling | {post.data.title}</title>
      </Head>

      <main>
        <img
          className={styles.postBanner}
          src={formattedPost.data.banner.url}
          alt=""
        />
        <article className={`${styles.postContainer} ${commonStyles.wrapper}`}>
          <header>
            <h1>{formattedPost.data.title}</h1>

            <div>
              <time>
                <FiCalendar /> {formattedPost.first_publication_date}
              </time>

              <span>
                <FiUser /> {formattedPost.data.author}
              </span>

              <span>
                <FiClock /> {readOfTime} min
              </span>
            </div>

            <em>{formattedPost.last_publication_date}</em>
          </header>

          {formattedPost.data.content.map(item => {
            return (
              <section key={item.heading} className={styles.postContent}>
                <h3>{item.heading}</h3>

                {item.body.map(paragraph => (
                  <div
                    key={paragraph.text}
                    className={styles.postText}
                    dangerouslySetInnerHTML={{ __html: paragraph.text }}
                  />
                ))}
              </section>
            );
          })}

          <section className={styles.postPaginate}>
            {prevPost && (
              <Link href={prevPost.uid}>
                <a>
                  <p>{prevPost.title}</p>
                  <span>Post Anterior</span>
                </a>
              </Link>
            )}

            {nextPost && (
              <Link href={nextPost.uid}>
                <a>
                  <p>{nextPost.title}</p>
                  <span>Próximo Post</span>
                </a>
              </Link>
            )}
          </section>

          <section id="comments" />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 3,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const prevPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: response.id,
      orderings: `[document.first_publication_date]`,
    })
  ).results[0];

  const nextPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: response.id,
      orderings: `[document.first_publication_date desc]`,
    })
  ).results[0];

  return {
    props: {
      post: response,
      preview,
      nextPost: nextPost
        ? { title: nextPost.data?.title, uid: nextPost.uid }
        : null,
      prevPost: prevPost
        ? { title: prevPost.data?.title, uid: prevPost.uid }
        : null,
    },
    redirect: 60 * 60 * 24, // 24 hora
  };
};
