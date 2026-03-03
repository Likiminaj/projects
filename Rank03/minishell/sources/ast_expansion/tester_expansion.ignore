/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tester_expansion.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/22 20:26:10 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/11 08:25:39 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

# include <unistd.h>
# include <stdlib.h>
# include <fcntl.h>
# include <limits.h>
# include <stdio.h>
# include <sys/types.h>
# include <sys/wait.h>
# include <signal.h>
# include <readline/readline.h>
# include <readline/history.h>

/* ===================== */
/* Minimal minishell API */
/* ===================== */

typedef struct s_env
{
	char	**envp;
}	t_env;
typedef enum e_redirect_type
{
	REDIR_IN,				/* < (input) > (output) */
	REDIR_OUT,
	REDIR_APPEND,			/* >> (append), << (heredoc)*/
	REDIR_HEREDOC
}	t_redirect_type;

typedef struct s_redirect
{
	t_redirect_type		type;		/* R_IN, R_OUT, R_APPEND, R_HEREDOC */
	char				*file;		/* Filename or heredoc delimiter */
	struct s_redirect	*next;		/* Next redirect in chain */
}	t_redirect;

typedef enum e_ast_type
{
	AST_COMMAND,			/* Simple command */
	AST_PIPE,				/* Pipeline (|) */
}	t_ast_type;

typedef struct s_ast
{
	t_ast_type		type;			/* Type of AST node */
	char			**args;			/* Command arguments (NULL-terminated) */
	t_redirect		*redirects;		/* Linked list of redirections */
	struct s_ast	*left;			/* Left child */
	struct s_ast	*right;			/* Right child */
}	t_ast;

/* ===================== */
/* Helper functions      */
/* ===================== */

static void	print_args(char **args)
{
	int	i = 0;

	while (args && args[i])
	{
		printf("arg[%d] = \"%s\"\n", i, args[i]);
		i++;
	}
}

/* ===================== */
/* libft                 */
/* ===================== */

char	*ft_strchr(const char *s, int c)
{
	int	count;

	count = 0;
	while (s[count] != '\0')
	{
		if (s[count] == (char)c)
			return ((char *)&s[count]);
		count++;
	}
	if ((char)c == '\0')
		return ((char *)&s[count]);
	return (NULL);
}

void	ft_putendl_fd(char *s, int fd)
{
	if (!s)
		return ;
	while (*s)
	{
		write (fd, s, 1);
		s++;
	}
	write (fd, "\n", 1);
}

void	ft_putstr_fd(char *s, int fd)
{
	if (!s)
		return ;
	while (*s)
	{
		write (fd, s, 1);
		s++;
	}
}

size_t	ft_strlen(const char *s)
{
	size_t	count;

	count = 0;
	while (*s)
	{
		count++;
		s++;
	}
	return (count);
}

size_t	ft_strlcat(char *dst, const char *src, size_t size)
{
	size_t	dst_len;
	size_t	src_len;
	size_t	k;
	size_t	l;

	dst_len = ft_strlen(dst);
	src_len = ft_strlen(src);
	if (size <= dst_len)
		return (size + src_len);
	k = dst_len;
	l = 0;
	while (l < src_len && k < size -1)
	{
		dst[k] = src[l];
		k++;
		l++;
	}
	dst[k] = '\0';
	return (dst_len + src_len);
}

size_t	ft_strlcpy(char *dst, const char *src, size_t size)
{
	size_t	n;
	size_t	src_len;

	src_len = ft_strlen(src);
	n = 0;
	if (size == 0)
		return (src_len);
	while (n < size -1 && src[n] != '\0')
	{
		dst[n] = src[n];
		n++;
	}
	dst[n] = '\0';
	return (src_len);
}

void	ft_bzero(void *s, size_t n)
{
	size_t			i;
	unsigned char	*str;

	str = (unsigned char *)s;
	i = 0;
	while (i < n)
	{
		str[i] = 0;
		i++;
	}
}

void	*ft_calloc(size_t nmemb, size_t size)
{
	size_t	bytes;
	void	*ptr;

	if (nmemb == 0 || size == 0)
		return (malloc(0));
	bytes = nmemb * size;
	if (size && ((bytes / size) != nmemb))
		return (NULL);
	ptr = malloc(bytes);
	if (!ptr)
		return (NULL);
	ft_bzero(ptr, bytes);
	return (ptr);
}

char	*ft_strappend(char **s1, const char *s2)
{
	char	*str;

	if (!*s1 || !s2)
		return (NULL);
	str = (char *)ft_calloc((ft_strlen(*s1) + ft_strlen(s2)) + 1, sizeof(char));
	if (!str)
		return (NULL);
	ft_strlcpy(str, *s1, ft_strlen(*s1) + 1);
	ft_strlcat(str, s2, ft_strlen(*s1) + ft_strlen(s2) + 1);
	free(*s1);
	return (str);
}

char	*ft_strdup(const char *s)
{
	char	*str;
	int		s_length;
	int		n;

	s_length = 0;
	while (s[s_length] != '\0')
		s_length++;
	str = malloc(s_length + 1);
	if (!str)
		return (NULL);
	n = 0;
	while (s[n] != '\0')
	{
		str[n] = s[n];
		n++;
	}
	str[n] = '\0';
	return (str);
}

int	ft_strncmp(const char *s1, const char *s2, size_t n)
{
	size_t	i;

	if (n == 0)
		return (0);
	i = 0;
	while (i < n && s1[i] != '\0' && s2[i] != '\0')
	{
		if ((unsigned char)s1[i] != (unsigned char)s2[i])
			return ((unsigned char)s1[i] - (unsigned char)s2[i]);
		i++;
	}
	if (i == n)
		return (0);
	return ((unsigned char)s1[i] - (unsigned char)s2[i]);
}

int	counter(int nb)
{
	int		digit_count;
	long	m;

	digit_count = 0;
	m = (long)nb;
	if (nb < 0)
	{
		digit_count++;
		m = -m;
	}
	while (m != 0)
	{
		digit_count++;
		m = m / 10;
	}
	return (digit_count);
}

char	*ft_itoa(int n)
{
	int		digit_count;
	long	m;
	int		i;
	char	*into_char;

	if (n == 0)
		return (ft_strdup("0"));
	digit_count = counter(n);
	into_char = malloc((digit_count + 1) * sizeof(char));
	if (!into_char)
		return (NULL);
	into_char[digit_count] = '\0';
	i = digit_count - 1;
	m = (long)n;
	if (n < 0)
		m = -m;
	while (m != 0 && i >= 0)
	{
		into_char[i] = m % 10 + '0';
		i--;
		m = m / 10;
	}
	if (n < 0)
		into_char[i] = '-';
	return (into_char);
}

/* Copies exactly n bytes from src to dest. Does not stop at '\0'.
Does not add a null terminator. */
void	*ft_memcpy(void *dest, const void *src, size_t n)
{
	size_t			i;
	unsigned char	*ptr_src;
	unsigned char	*ptr_dest;

	i = 0;
	ptr_src = (unsigned char *)src;
	ptr_dest = (unsigned char *)dest;
	while (i < n)
	{
		ptr_dest[i] = ptr_src[i];
		i++;
	}
	return (dest);
}

/* ===== Prototypes from your code ===== */
int				ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_command(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat);
int				dol_found(char *argument);
int				is_dol_only(char *argument);
int				char_is_valid(char c);
char			*expand_string(char *str, char **envp, int *exit_stat);
int				str_exp(char *str, char **envp, char **result, int *exit_stat);
char			*ft_charjoin(char *str, char c);
int				expand_var(t_ast *ast, int i, int *exit_status, char **envp);
char			*find_var_name(char *arg);
int				expand_error_code(t_ast *ast, int i, int *exit_status);
int				expand_fst_var(t_ast *ast, char **envp, char *var_name, int i);
int				expand_var_ok(t_ast *ast, char *envp, char *var_name, int i);
int				expand_var_nok(t_ast *ast, char *var_name, int i);
void			swap_new(t_ast *ast, int i, char *new_ast);
int				find_index_in_env(char **envp, char *var_name);
char			*find_content(char *argument);

/* ===================== */
/* MY CODE               */
/* ===================== */
int	ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat)
{
	t_redirect	*redirections;

	if (!ast)
		return (1);
	if (ast->type == AST_PIPE)
	{
		if (!ft_expand_pipe(ast, env, exit_stat))
			return (0);
		return (1);
	}
	if (ast->type == AST_COMMAND)
	{
		if (ast->args)
			if (!ft_expand_command(ast, env, exit_stat))
				return (0);
		redirections = ast->redirects;
		while (redirections)
		{
			if (!ft_expand_redir(redirections, env, exit_stat))
				return (0);
			redirections = redirections->next;
		}
	}
	return (1);
}

int	ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat)
{
	if (!ft_expand_ast(ast->left, env, exit_stat))
		return (0);
	if (!ft_expand_ast(ast->right, env, exit_stat))
		return (0);
	return (1);
}

int	ft_expand_command(t_ast *ast, t_env *env, int *exit_stat)
{
	int	i;

	if (!ast || !ast->args)
		return (1);
	i = 0;
	while (ast->args[i] != NULL)
	{
		if (dol_found(ast->args[i]) > 0 && !is_dol_only(ast->args[i]))
		{
			if (expand_var(ast, i, exit_stat, env->envp) == 1)
				return (0);
		}
		i++;
	}
	return (1);
}

int	dol_found(char *argument)
{
	int	i;
	int	count;

	i = 0;
	count = 0;
	while (argument[i] != '\0' && argument[i + 1] != '\0')
	{
		if (argument[i] == '$')
			count++;
		i++;
	}
	return (count);
}

int	is_dol_only(char *argument)
{
	if (argument[0] == '$' && argument[1] == '\0')
		return (1);
	return (0);
}

char	*expand_string(char *str, char **envp, int *exit_stat)
{
	char	*result;
	int		i;
	int		expanded_len;

	result = ft_strdup("");
	i = 0;
	while (str[i])
	{
		if (str[i] == '$')
		{
			expanded_len = str_exp(&str[i], envp, &result, exit_stat);
			if (expanded_len == 0)
				return (free(result), NULL);
			i += expanded_len;
		}
		else
		{
			result = ft_charjoin(result, str[i]);
			if (!result)
				return (NULL);
			i++;
		}
	}
	return (result);
}

int	str_exp(char *str, char **envp, char **result, int *exit_stat)
{
	char	*var_name;
	char	*content;
	int		index;
	int		result_len;
	char	*exit_str;

	var_name = find_var_name(str);
	if (!var_name)
		return (0);
	if (var_name[0] == '?' && var_name[1] == '\0')
	{
		exit_str = ft_itoa(*exit_stat);
		*result = ft_strappend(result, exit_str);
		free(exit_str);
		free(var_name);
		return (2);
	}
	index = find_index_in_env(envp, var_name);
	if (index != -1)
	{
		content = find_content(envp[index]);
		*result = ft_strappend(result, content);
		free (content);
	}
	else
	{
		ft_putstr_fd("minishell: $", 2);
		ft_putstr_fd(var_name, 2);
		ft_putendl_fd(": ambiguous redirect", 2);
		return (0);
	}
	result_len = ft_strlen(var_name) + 1;
	free(var_name);
	return (result_len);
}

int	expand_var(t_ast *ast, int i, int *exit_status, char **envp)
{
	int		j;
	char	*var_name;

	while (1)
	{
		j = 0;
		while (ast->args[i][j] && ast->args[i][j] != '$')
			j++;
		if (!ast->args[i][j])
			break ;
		var_name = find_var_name(ast->args[i] + j);
		if (!var_name)
			break ;
		if (var_name[0] == '?' && var_name[1] == '\0')
			expand_error_code(ast, i, exit_status);
		else
			expand_fst_var(ast, envp, var_name, i);
		free(var_name);
	}
	return (0);
}

/* In a given string extracts first var_name (after $) */
char	*find_var_name(char *arg)
{
	char	*var_name;
	int		len;

	if (!arg || arg[0] != '$')
		return (NULL);
	if (arg[1] == '?')
	{
		var_name = malloc(2);
		if (!var_name)
			return (NULL);
		var_name[0] = '?';
		var_name[1] = '\0';
	}
	else
	{
		len = 0;
		while (arg[1 + len] != '\0' && char_is_valid(arg[1 + len]) == 1)
			len++;
		var_name = malloc(sizeof(char) * (len + 1));
		if (!var_name)
			return (NULL);
		ft_memcpy(var_name, arg + 1, len);
		var_name[len] = '\0';
	}
	return (var_name);
}

int	expand_error_code(t_ast *ast, int i, int *exit_status)
{
	char	*error_number;
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	error_number = ft_itoa(*exit_status);
	new_ast = malloc(ft_strlen(ast->args[i]) + ft_strlen(error_number) - 1);
	if (!new_ast)
		return (1);
	j = 0;
	k = 0;
	while (ft_strncmp(ast->args[i] + k, "$?", 2) != 0)
		new_ast[j++] = ast->args[i][k++];
	len = k + 2;
	k = 0;
	while (error_number[k] != '\0')
		new_ast[j++] = error_number[k++];
	len += k;
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(ast, i, new_ast);
	return (free(error_number), 0);
}

int	expand_var_ok(t_ast *ast, char *envp, char *n, int i)
{
	char	*cont;
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	cont = find_content(envp);
	if (cont == NULL)
		return (1);
	new_ast = malloc(ft_strlen(ast->args[i]) - ft_strlen(n) + ft_strlen(cont));
	if (!new_ast)
		return (1);
	j = 0;
	k = 0;
	while (ast->args[i][k] != '$')
		new_ast[j++] = ast->args[i][k++];
	len = ft_strlen(n) + k + 1;
	k = 0;
	while (cont[k] != '\0')
		new_ast[j++] = cont[k++];
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(ast, i, new_ast);
	return (free(cont), 0);
}

int	expand_var_nok(t_ast *ast, char *var_name, int i)
{
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	new_ast = malloc(ft_strlen(ast->args[i]) - ft_strlen(var_name));
	if (!new_ast)
		return (1);
	len = ft_strlen(var_name);
	j = 0;
	k = 0;
	while (ast->args[i][k] != '$')
		new_ast[j++] = ast->args[i][k++];
	len += (k + 1);
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(ast, i, new_ast);
	return (0);
}

void	swap_new(t_ast *ast, int i, char *new_ast)
{
	if (!new_ast)
		return ;
	free(ast->args[i]);
	ast->args[i] = new_ast;
}

/* Looks for a specific variable in the environement.
Returns the index of this variable in the env array. */
int	find_index_in_env(char **envp, char *var_name)
{
	int		i;
	size_t	var_len;		

	if (!envp || !var_name)
		return (-1);
	var_len = ft_strlen(var_name);
	if (var_len == 0)
		return (-1);
	i = 0;
	while (envp[i] != NULL)
	{
		if ((ft_strncmp(envp[i], var_name, var_len) == 0) \
&& envp[i][var_len] == '=')
			return (i);
		i++;
	}
	return (-1);
}

/* Receives an argument such as "var_name=content" and extracts
content only (after =). */
char	*find_content(char *argument)
{
	char	*equal_start;

	if (!argument)
		return (NULL);
	equal_start = ft_strchr(argument, '=');
	if (!equal_start)
		return (NULL);
	return (ft_strdup(equal_start + 1));
}

int	expand_fst_var(t_ast *ast, char **envp, char *var_name, int i)
{
	int	index;

	index = find_index_in_env(envp, var_name);
	if (index != -1)
	{
		if (expand_var_ok(ast, envp[index], var_name, i) == 1)
			return (1);
	}
	else
	{
		if (expand_var_nok(ast, var_name, i) == 1)
			return (1);
	}
	return (0);
}

char	*ft_charjoin(char *str, char c)
{
	char	*new_str;
	int		len;
	int		i;

	len = ft_strlen(str);
	new_str = malloc(len + 2);
	if (!new_str)
		return (NULL);
	i = 0;
	while (str[i])
	{
		new_str[i] = str[i];
		i++;
	}
	new_str[i] = c;
	new_str[i + 1] = '\0';
	free(str);
	return (new_str);
}

int	char_is_valid(char c)
{
	if (c == '\0')
		return (0);
	if (!(((c >= 'a') && (c <= 'z'))
			|| ((c >= 'A') && (c <= 'Z'))
			|| (c == '_')
			|| ((c >= '0') && (c <= '9'))))
		return (0);
	return (1);
}

int	ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat)
{
	char	*expanded;

	if (!redir || !redir->file)
		return (1);
	if (dol_found(redir->file) > 0 && !is_dol_only(redir->file))
	{
		expanded = expand_string(redir->file, env->envp, exit_stat);
		if (!expanded)
			return (0);
		free(redir->file);
		redir->file = expanded;
	}
	return (1);
}

/* ===================== */
/* MAIN TEST ENTRY POINT */
/* ===================== */

int	main(void)
{
	t_ast	ast;
	t_env	env;
	int		exit_status = 42;

	/* Fake environment */
	char *envp[] = {
		"HOME=/home/user",
		"USER=alice",
		"EMPTY=",
		NULL
	};

	/* Arguments to expand */
	char *args[] = {
		strdup("echo"),
		strdup("$HOME"),
		strdup("user:$USER"),
		strdup("status:$?"),
		strdup("missing:$NOTSET"),
		strdup("trailing$"),
		strdup("$"),
		strdup("$$"),
		strdup("multi:$HOME:$USER"),
		NULL
	};

	ast.type = AST_COMMAND;
	ast.args = args;
	ast.redirects = NULL;  // ← FIX
	ast.left = NULL;       // ← FIX
	ast.right = NULL;      // ← FIX
	
	env.envp = envp;

	printf("=== BEFORE EXPANSION ===\n");
	print_args(ast.args);

	if (ft_expand_ast(&ast, &env, &exit_status) == 0)
	{
		printf("Expansion failed\n");
		return (1);
	}

	printf("\n=== AFTER EXPANSION ===\n");
	print_args(ast.args);

	/* Cleanup */
	for (int i = 0; ast.args[i]; i++)
		free(ast.args[i]);

	return (0);
}
